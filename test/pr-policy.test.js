import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validatePullRequest } from '../.github/scripts/validate-pr.mjs';

// Synthetic issue references for local validation. No tickets or PRs are created.
const body = `**Ticket:** [ABC-123](https://github.com/devansh-helfie/trunk-based-development-lab/issues/123)

## User-Facing Changes
Show the running release identity.

## Technical Changes
Read metadata from the version endpoint.

## Feature Flags
None

## Risks
None
`;

function pr(overrides = {}) {
  return { title: 'feat: ABC-123 show running release identity',
    body, ...overrides };
}

for (const [title, classification] of [
  ['feat: ABC-123 show version', 'minor'],
  ['fix(api): ABC-123 correct the price', 'patch'],
  ['feat!: ABC-123 change the API contract', 'major'],
  ['fix(api)!: ABC-123 reject legacy inputs', 'major'],
  ['docs: ABC-123 update instructions', 'none'],
  ['ci: ABC-123 validate PR titles', 'none']
]) {
  test(`title-only classification: ${classification} with ${title.split(':')[0]}`, () => {
    const result = validatePullRequest(pr({ title }));
    assert.deepEqual(result.errors, []);
    assert.equal(result.classification, classification);
  });
}

test('labels are optional and never control classification', () => {
  for (const labels of [[], ['semver:patch'], ['semver:minor', 'semver:major'], ['release:1.3.0', 'qa-bug']]) {
    const result = validatePullRequest(pr({ labels }));
    assert.deepEqual(result.errors, []);
    assert.equal(result.classification, 'minor');
  }
});

test('editing the PR title changes the derived classification', () => {
  const pullRequest = pr();
  assert.equal(validatePullRequest(pullRequest).classification, 'minor');
  pullRequest.title = 'fix: ABC-123 correct the displayed identity';
  assert.equal(validatePullRequest(pullRequest).classification, 'patch');
  pullRequest.title = 'fix!: ABC-123 change the API contract';
  assert.equal(validatePullRequest(pullRequest).classification, 'major');
});

test('malformed, unsupported and multiline titles fail', () => {
  for (const title of ['Update version', 'feat: show version', 'unknown: ABC-123 show version',
    'feat(api):ABC-123 show version', 'feat: ABC-123 show version\nfix: ABC-123 hide a change']) {
    assert.ok(validatePullRequest(pr({ title })).errors.length > 0);
  }
});

test('ticket key and linked issue must match, and comments do not fill the template', () => {
  assert.ok(validatePullRequest(pr({ body: body.replace('[ABC-123]', '[ABC-456]') })).errors.some((error) => error.includes('Ticket must')));
  assert.ok(validatePullRequest(pr({ title: 'feat: show version' })).errors.some((error) => error.includes('Use a title')));
  const template = readFileSync(new URL('../.github/pull_request_template.md', import.meta.url), 'utf8');
  const result = validatePullRequest(pr({ body: template }));
  assert.equal(result.errors.filter((error) => error.startsWith('Fill ')).length, 4);
  assert.ok(result.errors.some((error) => error.includes('Ticket must')));
});

test('missing or duplicated required sections fail, Windows line endings work', () => {
  assert.ok(validatePullRequest(pr({ body: body.replace('## Risks', '## Other') })).errors.some((error) => error.includes('section named "Risks"')));
  assert.ok(validatePullRequest(pr({ body: body + '\n## Risks\nNone' })).errors.some((error) => error.includes('section named "Risks"')));
  assert.deepEqual(validatePullRequest(pr({ body: body.replaceAll('\n', '\r\n') })).errors, []);
});

test('normal PRs cannot hide breaking declarations or release overrides in their body', () => {
  for (const footer of ['BREAKING CHANGE: old API removed', 'Release-As: 9.0.0', 'BEGIN_COMMIT_OVERRIDE']) {
    assert.ok(validatePullRequest(pr({ body: body + '\n' + footer })).errors.length > 0);
  }
  assert.deepEqual(validatePullRequest(pr({ title: 'feat!: ABC-123 change contract',
    body: body + '\nBREAKING CHANGE: old API removed' })).errors, []);
});

test('release lifecycle labels do not exempt malformed PR metadata', () => {
  const result = validatePullRequest(pr({ title: 'Invalid title', labels: ['autorelease: pending'] }));
  assert.ok(result.errors.some((error) => error.includes('Use a title')));
});
