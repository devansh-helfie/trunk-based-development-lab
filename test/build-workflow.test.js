import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const workflow = readFileSync(new URL('../.github/workflows/build.yml', import.meta.url), 'utf8');
const repository = 'devansh-helfie/trunk-based-development-lab';
const sha = 'a'.repeat(40);
const digest = `sha256:${'b'.repeat(64)}`;
const image = `ghcr.io/${repository}`;
const originalRun = {
  id: 150, run_attempt: 1, conclusion: 'success', event: 'push', head_branch: 'main',
  head_sha: sha, repository: { full_name: repository }, path: '.github/workflows/build.yml'
};
const evidence = {
  schemaVersion: 1, repository, commitSha: sha, image: `${image}@${digest}`,
  digest, platform: 'linux/arm64',
  build: { runId: '150', runAttempt: '1', workflow: '.github/workflows/build.yml' },
  attestationUrl: 'https://github.com/example/attestation'
};

function stepBody(name) {
  const step = workflow.split(`      - name: ${name}\n`)[1]?.split('\n      - name:')[0];
  assert.ok(step, `Workflow step must exist: ${name}`);
  return step.split('        run: |\n')[1].split('\n').map((line) => line.slice(10)).join('\n');
}

// Execute real workflow Bash and jq with a fake GitHub CLI. No network or Docker.
function withFixture(settings, check) {
  const directory = mkdtempSync(join(tmpdir(), 'trunk-build-reuse-'));
  const fixture = {
    successes: [], attempts: {}, originalRun, evidence,
    invocation: `https://github.com/${repository}/actions/runs/150/attempts/1`, ...settings
  };
  try {
    writeFileSync(join(directory, 'fixture.json'), JSON.stringify(fixture));
    writeFileSync(join(directory, 'gh'), `#!/usr/bin/env node
const { readFileSync, mkdirSync, writeFileSync } = require('node:fs');
const f = JSON.parse(readFileSync(process.env.FIXTURE_PATH, 'utf8'));
const args = process.argv.slice(2);
if (f.apiFailure) process.exit(1);
if (args.includes('--paginate')) {
  if (!args.includes('head_sha=' + process.env.GITHUB_SHA) ||
      !args.includes('event=push') || !args.includes('status=success')) process.exit(9);
  for (const [id, attempt] of f.successes) console.log(id + '\\t' + attempt);
} else if (args[0] === 'run') {
  if (f.missingArtifact) process.exit(1);
  mkdirSync('existing-build');
  writeFileSync('existing-build/build-evidence.json', JSON.stringify(f.evidence));
} else if (args[0] === 'attestation') {
  if (f.badAttestation) process.exit(1);
  for (const expected of [process.env.GITHUB_REPOSITORY,
      process.env.GITHUB_REPOSITORY + '/.github/workflows/build.yml',
      process.env.GITHUB_SHA, 'oci://' + process.env.IMAGE_NAME + '@' + process.env.IMAGE_DIGEST]) {
    if (!args.includes(expected)) process.exit(9);
  }
  console.log(JSON.stringify([{verificationResult: {statement: {predicate: {
    runDetails: {metadata: {invocationId: f.invocation}}
  }}}}]));
} else if (args.includes('--jq')) {
  const attempt = args.find((arg) => arg.includes('/attempts/')).split('/').pop();
  console.log(f.attempts[attempt] || 'failure');
} else {
  console.log(JSON.stringify(f.originalRun));
}
`, { mode: 0o700 });
    const env = {
      ...process.env, PATH: `${directory}:${process.env.PATH}`, FIXTURE_PATH: join(directory, 'fixture.json'),
      GITHUB_REPOSITORY: repository, GITHUB_SHA: sha, GITHUB_RUN_ID: '200',
      GITHUB_RUN_ATTEMPT: fixture.currentAttempt ?? '1', GITHUB_SERVER_URL: 'https://github.com',
      GITHUB_OUTPUT: join(directory, 'outputs'), GITHUB_STEP_SUMMARY: join(directory, 'summary'),
      IMAGE_NAME: image, PREVIOUS_RUN_ID: '150', PREVIOUS_ATTEMPT: '1',
      IMAGE_DIGEST: digest, ORIGINAL_RUN_ID: '150', ORIGINAL_ATTEMPT: '1', REUSED: 'true'
    };
    check((name, overrides = {}) => {
      writeFileSync(env.GITHUB_OUTPUT, '');
      const result = spawnSync('bash', ['-c', stepBody(name)], {
        cwd: directory, encoding: 'utf8', env: { ...env, ...overrides }
      });
      return { ...result, outputs: readFileSync(env.GITHUB_OUTPUT, 'utf8') };
    }, directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

const find = 'Find a successful publication for this commit';
const load = 'Load and validate the existing build evidence';
const verify = 'Verify the signed build provenance';

test('a first build or failed retry uses the new-build path', () => {
  for (const settings of [{}, { currentAttempt: '3', attempts: { 1: 'failure', 2: 'cancelled' } }]) {
    withFixture(settings, (run) => {
      const result = run(find);
      assert.equal(result.status, 0, result.stderr);
      assert.match(result.outputs, /found=false/);
    });
  }
});

test('finds another successful run or an earlier successful attempt of the same run', () => {
  for (const [settings, expected] of [
    [{ successes: [[150, 1]] }, 'run_id=150'],
    [{ currentAttempt: '3', attempts: { 1: 'success', 2: 'failure' } }, 'run_id=200']
  ]) {
    withFixture(settings, (run) => {
      const result = run(find);
      assert.equal(result.status, 0, result.stderr);
      assert.ok(result.outputs.includes(expected));
      assert.match(result.outputs, /found=true/);
    });
  }
});

test('reuse validates evidence, verifies provenance, and preserves the original build identity', () => {
  withFixture({}, (run, directory) => {
    for (const name of [load, verify, 'Record the successful build evidence']) {
      const result = run(name);
      assert.equal(result.status, 0, `${name}: ${result.stderr}`);
    }
    const saved = JSON.parse(readFileSync(join(directory, 'build-evidence.json'), 'utf8'));
    assert.deepEqual(saved.build, evidence.build);
    assert.equal(saved.digest, digest);
    assert.equal(saved.reused, true);
    assert.deepEqual(saved.publication, { runId: '200', runAttempt: '1' });
  });
});

test('missing artifacts and invalid source, digest or original run stop reuse', () => {
  for (const settings of [
    { missingArtifact: true }, { evidence: { ...evidence, commitSha: 'c'.repeat(40) } },
    { evidence: { ...evidence, digest: 'invalid' } },
    { evidence: { ...evidence, image: 'ghcr.io/other/image@' + digest } },
    { originalRun: { ...originalRun, conclusion: 'failure' } },
    { originalRun: { ...originalRun, path: '.github/workflows/untrusted.yml' } },
    { originalRun: { ...originalRun, head_sha: 'c'.repeat(40) } },
    { originalRun: { ...originalRun, run_attempt: 2 } }
  ]) {
    withFixture(settings, (run) => assert.notEqual(run(load).status, 0));
  }
});

test('API failures, invalid attestations and a different attested run stop reuse', () => {
  withFixture({ apiFailure: true }, (run) => assert.notEqual(run(find).status, 0));
  withFixture({ badAttestation: true }, (run) => assert.notEqual(run(verify).status, 0));
  withFixture({ invocation: 'https://github.com/other/run' }, (run) => assert.notEqual(run(verify).status, 0));
});
