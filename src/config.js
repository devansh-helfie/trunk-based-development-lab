import { resolve } from 'node:path';

const ENVIRONMENTS = ['LOCAL', 'DEV', 'TEST', 'PROD'];
const DEMO_FAULTS = ['none', 'discount-boundary'];
const MINIMUM_PASSWORD_LENGTH = 12;

export function booleanSetting(name, value, fallback = false) {
  if (value === undefined) {
    return fallback;
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }

  throw new Error(`${name} must be true or false`);
}

export function configuration(env = process.env) {
  const environment = env.APP_ENV ?? 'LOCAL';
  const demoFault = env.DEMO_FAULT ?? 'none';
  const adminPassword = env.FLAGS_ADMIN_PASSWORD || undefined;

  if (!ENVIRONMENTS.includes(environment)) {
    throw new Error('APP_ENV must be LOCAL, DEV, TEST or PROD');
  }
  if (!DEMO_FAULTS.includes(demoFault)) {
    throw new Error('DEMO_FAULT must be none or discount-boundary');
  }
  if (environment === 'PROD' && demoFault !== 'none') {
    throw new Error('Demo fault injection is forbidden in PROD');
  }
  if (adminPassword !== undefined && adminPassword.length < MINIMUM_PASSWORD_LENGTH) {
    throw new Error('FLAGS_ADMIN_PASSWORD must have at least 12 characters');
  }

  return {
    environment,
    demoFault,
    adminPassword,
    bulkDiscount: booleanSetting('FEATURE_BULK_DISCOUNT', env.FEATURE_BULK_DISCOUNT),
    flagsFile: env.FLAGS_FILE ?? resolve(`data/${environment.toLowerCase()}-flags.json`),
    commitSha: env.COMMIT_SHA ?? 'unknown',
    releaseIdentity: env.RELEASE_IDENTITY ?? 'unreleased',
    imageDigest: env.IMAGE_DIGEST ?? 'unknown',
    buildRunId: env.BUILD_RUN_ID ?? 'unknown'
  };
}
