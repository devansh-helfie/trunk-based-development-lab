import { createHash, randomUUID } from 'node:crypto';
import {
  closeSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync
} from 'node:fs';
import { dirname, resolve } from 'node:path';

const MAXIMUM_FLAGS = 64;
const RESERVED_FLAG_NAMES = new Set(['constructor', 'prototype', '__proto__']);

export function validFlagName(name) {
  if (typeof name !== 'string' || RESERVED_FLAG_NAMES.has(name)) {
    return false;
  }
  return /^[a-z][a-zA-Z0-9]{0,47}$/.test(name);
}

function requestError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function isValidSavedState(saved, environment) {
  if (!saved || typeof saved !== 'object') {
    return false;
  }

  const hasValidFlags = saved.flags &&
    typeof saved.flags === 'object' &&
    !Array.isArray(saved.flags) &&
    Object.keys(saved.flags).length <= MAXIMUM_FLAGS &&
    Object.entries(saved.flags).every(([name, value]) => {
      return validFlagName(name) && typeof value === 'boolean';
    });

  const hasValidRevision = Number.isSafeInteger(saved.revision) && saved.revision >= 0;
  const hasValidTimestamp = typeof saved.updatedAt === 'string' &&
    !Number.isNaN(Date.parse(saved.updatedAt));

  return saved.schema === 1 &&
    saved.environment === environment &&
    hasValidFlags &&
    hasValidRevision &&
    hasValidTimestamp;
}

function writeState(file, state) {
  if (!file) {
    return;
  }

  mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
  const temporaryFile = `${file}.${randomUUID()}.tmp`;

  // Replace the file only after the complete new state has been written.
  try {
    const descriptor = openSync(temporaryFile, 'wx', 0o600);
    try {
      writeFileSync(descriptor, `${JSON.stringify(state, null, 2)}\n`);
      fsyncSync(descriptor);
    } finally {
      closeSync(descriptor);
    }
    renameSync(temporaryFile, file);
  } finally {
    if (existsSync(temporaryFile)) {
      unlinkSync(temporaryFile);
    }
  }
}

// Each environment has one file, owned by one application process.
export function createFlagStore({ environment, filename, bulkDiscount }) {
  const file = filename === ':memory:' ? undefined : resolve(filename);
  let state = {
    schema: 1,
    environment,
    revision: 0,
    updatedAt: new Date().toISOString(),
    flags: { bulkDiscount }
  };

  if (file && existsSync(file)) {
    const saved = JSON.parse(readFileSync(file, 'utf8'));
    if (!isValidSavedState(saved, environment)) {
      throw new Error('Invalid flag store or environment mismatch; refusing to reset saved configuration');
    }
    state = saved;
  } else {
    writeState(file, state);
  }

  function snapshot() {
    const sortedEntries = Object.entries(state.flags).sort(([a], [b]) => a.localeCompare(b));
    const flags = Object.fromEntries(sortedEntries);
    const identity = JSON.stringify({ environment, revision: state.revision, flags });
    const digest = createHash('sha256').update(identity).digest('hex');

    return {
      ...state,
      flags,
      configurationId: `sha256:${digest}`
    };
  }

  function validateChange(name, expectedRevision) {
    if (!validFlagName(name)) {
      throw requestError(400, 'Use a camelCase name, starting with a lowercase letter, up to 48 characters');
    }
    if (String(state.revision) !== expectedRevision) {
      throw requestError(409, 'Flags changed since you loaded the page. Refresh and retry.');
    }
  }

  function saveFlags(flags) {
    const nextState = {
      schema: 1,
      environment,
      revision: state.revision + 1,
      updatedAt: new Date().toISOString(),
      flags
    };

    // A failed disk write must leave the in-memory state unchanged.
    writeState(file, nextState);
    state = nextState;
    return snapshot();
  }

  function setFlag(name, enabled, expectedRevision) {
    validateChange(name, expectedRevision);
    if (typeof enabled !== 'boolean') {
      throw requestError(400, 'enabled must be a boolean');
    }

    const isNewFlag = !Object.hasOwn(state.flags, name);
    if (isNewFlag && Object.keys(state.flags).length >= MAXIMUM_FLAGS) {
      throw requestError(400, 'This demo supports at most 64 flags');
    }

    const flags = { ...state.flags, [name]: enabled };
    return saveFlags(flags);
  }

  function removeFlag(name, expectedRevision) {
    validateChange(name, expectedRevision);
    if (!Object.hasOwn(state.flags, name)) {
      throw requestError(404, 'Flag not found');
    }

    const flags = { ...state.flags };
    delete flags[name];
    return saveFlags(flags);
  }

  return { snapshot, set: setFlag, remove: removeFlag };
}
