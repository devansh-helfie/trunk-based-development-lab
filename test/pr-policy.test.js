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
    labels: [{ name: 'semver:minor' }], body, ...overrides };
}

for (const [title, label] of [
  ['feat: ABC-123 show version', 'semver:minor'],
  ['fix(api): ABC-123 correct the price', 'semver:patch'],
  ['feat!: ABC-123 change the API contract', 'semver:major'],
  ['fix(api)!: ABC-123 reject legacy inputs', 'semver:major'],
  ['docs: ABC-123 update instructions', 'semver:none'],
  ['ci: ABC-123 validate PR labels', 'semver:none']
]) {
  test(`valid title/label: ${label} with ${title.split(':')[0]}`, () => {
    const result = validatePullRequest(pr({ title, labels: [{ name: label }] }));
    assert.deepEqual(result.errors, []);
    assert.equal(result.classification, label);
  });
}

test('missing, conflicting and unknown semantic labels fail', () => {
  for (const labels of [[], ['semver:minor', 'semver:patch'], ['semver:banana'], ['semver:minor', 'semver:banana']]) {
    const result = validatePullRequest(pr({ labels }));
    assert.ok(result.errors.some((error) => error.includes('exactly one valid semantic label')));
  }
});

test('a label change requires a matching Conventional title', () => {
  const changedLabel = pr({ labels: ['semver:patch'] });
  assert.ok(validatePullRequest(changedLabel).errors.some((error) => error.includes('title requires semver:minor')));
  changedLabel.title = 'fix: ABC-123 correct the displayed identity';
  assert.deepEqual(validatePullRequest(changedLabel).errors, []);
});

test('minor, patch, major and none labels cannot contradict the title', () => {
  for (const [title, label] of [
    ['fix: ABC-123 correct price', 'semver:minor'],
    ['feat: ABC-123 show version', 'semver:patch'],
    ['feat: ABC-123 show version', 'semver:major'],
    ['feat!: ABC-123 change contract', 'semver:minor'],
    ['docs: ABC-123 update instructions', 'semver:patch']
  ]) {
    assert.ok(validatePullRequest(pr({ title, labels: [label] })).errors.length > 0);
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
  assert.deepEqual(validatePullRequest(pr({ title: 'feat!: ABC-123 change contract', labels: ['semver:major'],
    body: body + '\nBREAKING CHANGE: old API removed' })).errors, []);
});

test('release tracking labels neither change classification nor exempt a PR', () => {
  assert.deepEqual(validatePullRequest(pr({ labels: ['semver:minor', 'release:1.3.0', 'qa-bug'] })).errors, []);
  assert.ok(validatePullRequest(pr({ labels: ['autorelease: pending', 'release:1.3.0'] })).errors.length > 0);
});
