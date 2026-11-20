import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { configuration, createApp } from '../src/app.js';
import { createFlagStore } from '../src/flags.js';
import { quote, serve } from './http.js';

const password = 'test-only-password-123';
const authorization = `Basic ${Buffer.from(`admin:${password}`).toString('base64')}`;

async function fixture(context, overrides = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'release-lab-flags-test-'));
  context.after(() => rm(dir, { recursive: true, force: true }));
  const config = configuration({ APP_ENV: 'TEST', FLAGS_FILE: join(dir, 'flags.json'),
    FLAGS_ADMIN_PASSWORD: password, ...overrides });
  const base = await serve(createApp(config), context);
  const snapshot = async () => (await fetch(`${base}/api/admin/flags`, { headers: { authorization } })).json();
  const mutate = (name, enabled, revision, options = {}) => fetch(`${base}/api/admin/flags/${name}`, {
    method: options.remove ? 'DELETE' : 'PUT',
    headers: { authorization, 'Content-Type': 'application/json', 'X-Requested-With': 'ReleaseLab',
      'If-Match': String(revision), ...options.headers },
    ...(options.remove ? {} : { body: JSON.stringify({ enabled }) })
  });
  return { base, config, snapshot, mutate };
}

test('flag admin requires credentials and rejects cross-origin and stale writes', async (context) => {
  const { base, snapshot, mutate } = await fixture(context);
  for (const path of ['/flags', '/flags/panel.js', '/flags/panel.css', '/api/admin/flags']) {
    assert.equal((await fetch(base + path)).status, 401);
  }
  assert.equal((await mutate('bulkDiscount', true, 0, { headers: { authorization: 'Basic invalid' } })).status, 401);
  assert.equal((await mutate('bulkDiscount', true, 0, { headers: { Origin: 'https://untrusted.example' } })).status, 403);
  assert.equal((await mutate('bulkDiscount', true, 0, { headers: { 'X-Requested-With': '' } })).status, 403);
  assert.equal((await snapshot()).revision, 0);
  assert.equal((await mutate('bulkDiscount', true, 0)).status, 200);
  assert.equal((await mutate('bulkDiscount', false, 0)).status, 409);
  assert.equal((await snapshot()).flags.bulkDiscount, true);
  assert.equal((await mutate('constructor', true, 1)).status, 400);
  assert.equal((await mutate('customFlag', 'true', 1)).status, 400);
});

test('add, toggle and remove affect quotes, persist after restart and identify every revision', async (context) => {
  const { base, config, snapshot, mutate } = await fixture(context);
  const initial = await snapshot();
  assert.equal((await quote(base, 5)).body.totalCents, 5000);
  const enabledResponse = await mutate('bulkDiscount', true, 0);
  assert.equal(enabledResponse.status, 200);
  const enabled = await enabledResponse.json();
  assert.notEqual(enabled.configurationId, initial.configurationId);
  assert.equal((await quote(base, 5)).body.totalCents, 4500);

  const restarted = await serve(createApp(config), context);
  assert.equal((await quote(restarted, 5)).body.totalCents, 4500);
  const persisted = await (await fetch(`${restarted}/api/admin/flags`, { headers: { authorization } })).json();
  assert.equal(persisted.configurationId, enabled.configurationId);

  const offResponse = await mutate('bulkDiscount', false, 1);
  assert.equal(offResponse.status, 200);
  const off = await offResponse.json();
  assert.notEqual(off.configurationId, initial.configurationId, 'Switching back must not resurrect old QA configuration identity');
  assert.equal((await mutate('expressCheckout', false, 2)).status, 200);
  assert.equal((await snapshot()).flags.expressCheckout, false);
  assert.equal((await mutate('expressCheckout', undefined, 3, { remove: true })).status, 200);
  assert.equal((await mutate('bulkDiscount', undefined, 4, { remove: true })).status, 200);
  assert.equal((await quote(base, 5)).body.totalCents, 5000);
  assert.equal((await (await fetch(`${base}/version`)).json()).features.bulkDiscount, false);
  assert.deepEqual(JSON.parse(await readFile(config.flagsFile, 'utf8')).flags, {});
});

test('saved flags cannot be silently reused for a different environment or reset after corruption', async (context) => {
  const { config } = await fixture(context);
  assert.throws(() => createApp({ ...config, environment: 'PROD' }), /environment mismatch/);
  await writeFile(config.flagsFile, '{invalid');
  assert.throws(() => createFlagStore({ environment: 'TEST', filename: config.flagsFile, bulkDiscount: false }), SyntaxError);
});

test('panel is disabled without a password and credentials are never returned in metadata', async (context) => {
  const { base } = await fixture(context, { FLAGS_ADMIN_PASSWORD: '' });
  assert.equal((await fetch(`${base}/flags`)).status, 503);
  assert.equal((await fetch(`${base}/version`)).status, 200);
  const secured = await fixture(context);
  const metadata = await (await fetch(`${secured.base}/version`)).text();
  assert.ok(!metadata.includes(password));
  assert.ok(!metadata.includes(secured.config.flagsFile));
  assert.throws(() => configuration({ FLAGS_ADMIN_PASSWORD: 'short' }), /12 characters/);
  const html = await fetch(`${secured.base}/flags`, { headers: { authorization } });
  assert.equal(html.status, 200);
  assert.match(html.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert.match(await html.text(), /Environment switches/);
});
