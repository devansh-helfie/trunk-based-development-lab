import test from 'node:test';
import assert from 'node:assert/strict';
import { booleanSetting, configuration, createApp } from '../src/app.js';
import { quote, serve } from './http.js';

test('QA: deployed feature configuration and pricing boundaries match expectations', async (context) => {
  const expectedFlag = process.env.QA_EXPECT_BULK_DISCOUNT;
  assert.ok(['true', 'false'].includes(expectedFlag),
    'Set QA_EXPECT_BULK_DISCOUNT=true or false explicitly, independently of the app');
  const discountEnabled = booleanSetting('QA_EXPECT_BULK_DISCOUNT', expectedFlag);
  const baseUrl = process.env.BASE_URL ?? await serve(createApp(configuration({ ...process.env, FLAGS_FILE: ':memory:' })), context);
  const versionResponse = await fetch(`${baseUrl}/version`, { signal: AbortSignal.timeout(5000) });
  assert.equal(versionResponse.status, 200);
  const deployed = await versionResponse.json();
  context.diagnostic(`Validated target: ${JSON.stringify(deployed)}`);
  assert.equal(deployed.features.bulkDiscount, discountEnabled, 'Unexpected deployed feature flag');

  // Fixed expected results come from the business requirement, not the app's answer.
  const cases = discountEnabled
    ? [[1, 1000], [4, 4000], [5, 4500], [6, 5400]]
    : [[1, 1000], [4, 4000], [5, 5000], [6, 6000]];
  for (const [quantity, expectedTotal] of cases) {
    const actual = await quote(baseUrl, quantity);
    assert.equal(actual.status, 200);
    assert.equal(actual.body.totalCents, expectedTotal,
      `QA pricing failure for quantity=${quantity}: expected ${expectedTotal} cents`);
  }
  assert.equal((await quote(baseUrl, 0)).status, 400);
  const after = await (await fetch(`${baseUrl}/version`, { signal: AbortSignal.timeout(5000) })).json();
  assert.equal(after.configurationId, deployed.configurationId, 'Flag configuration changed during QA; rerun validation');
});
