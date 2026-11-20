async function showVersion() {
  const status = document.getElementById('status');
  const fields = {
    environment: 'environment',
    version: 'version',
    release: 'releaseIdentity',
    commit: 'commitSha',
    build: 'buildRunId'
  };

  try {
    const response = await fetch('/version');
    if (!response.ok) throw new Error('Version request failed');
    const version = await response.json();

    for (const [id, key] of Object.entries(fields)) {
      const value = version[key];
      const field = document.getElementById(id);
      field.textContent = value && value !== 'unknown' ? value : 'Not recorded';
      if (id === 'commit' && /^[a-f0-9]{40}$/.test(value)) {
        field.textContent = value.slice(0, 8);
        field.title = value;
      }
    }
    status.textContent = 'Application is responding.';
  } catch {
    for (const id of Object.keys(fields)) {
      document.getElementById(id).textContent = 'Unavailable';
    }
    status.textContent = 'Version details are unavailable. Reload to try again.';
    status.className = 'error';
  }
}

showVersion();
