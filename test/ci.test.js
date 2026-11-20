import test from 'node:test';
import assert from 'node:assert/strict';
import { configuration, createApp } from '../src/app.js';
import { quote, serve } from './http.js';

test('basic CI: health, metadata, ordinary quote and input validation', async (context) => {
  const baseUrl = await serve(createApp(configuration({ ...process.env, FLAGS_FILE: ':memory:' })), context);
  const health = await fetch(`${baseUrl}/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).status, 'ok');
  const version = await (await fetch(`${baseUrl}/version`)).json();
  assert.equal(version.application, 'trunk-based-development-lab');
  assert.match(version.version, /^\d+\.\d+\.\d+$/);
  const ordinary = await quote(baseUrl, 1);
  assert.equal(ordinary.status, 200);
  assert.equal(ordinary.body.totalCents, 1000);
  for (const quantity of [0, -1, 1.5, 101, '5', null]) {
    assert.equal((await quote(baseUrl, quantity)).status, 400);
  }
});

test('configuration rejects ambiguous flags and production fault injection', () => {
  assert.throws(() => configuration({ FEATURE_BULK_DISCOUNT: 'yes' }), /true or false/);
  assert.throws(() => configuration({ DEMO_FAULT: 'unknown' }), /DEMO_FAULT/);
  assert.throws(() => configuration({ APP_ENV: 'PROD', DEMO_FAULT: 'discount-boundary' }), /forbidden/);
});
