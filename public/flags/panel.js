const $ = (selector) => document.querySelector(selector);
let snapshot;
let busy = false;

function status(message, error = false) {
  $('#status').textContent = message;
  $('#status').classList.toggle('error', error);
}
async function request(path, options = {}) {
  const response = await fetch(path, { ...options, signal: AbortSignal.timeout(8000) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? `Request failed (${response.status})`);
  return data;
}
function controls(disabled) {
  busy = disabled;
  document.querySelectorAll('button').forEach((button) => { button.disabled = disabled; });
}
function render() {
  $('#revision').textContent = `${Object.keys(snapshot.flags).length} flags saved · Revision ${snapshot.revision}`;
  $('#configuration-id').textContent = snapshot.configurationId;
  $('#updated').textContent = `Saved ${new Date(snapshot.updatedAt).toLocaleString()}`;
  const list = $('#flag-list');
  list.replaceChildren();
  for (const [name, enabled] of Object.entries(snapshot.flags)) {
    const row = document.createElement('div');
    row.className = 'flag-row';
    const details = document.createElement('div');
    details.className = 'flag-details';
    const title = document.createElement('p');
    title.className = 'flag-name';
    title.textContent = name;
    const description = document.createElement('p');
    description.className = 'flag-description';
    description.textContent = name === 'bulkDiscount' ? '10% off orders of 5 or more items' : 'Custom flag; requires feature code';
    details.append(title, description);
    const actions = document.createElement('div');
    actions.className = 'flag-actions';
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'toggle';
    toggle.setAttribute('role', 'switch');
    toggle.setAttribute('aria-checked', String(enabled));
    toggle.setAttribute('aria-label', `Toggle ${name}`);
    toggle.textContent = enabled ? 'ON' : 'OFF';
    toggle.addEventListener('click', () => mutate(name, !enabled));
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove';
    remove.textContent = 'Remove';
    remove.setAttribute('aria-label', `Remove ${name}`);
    remove.addEventListener('click', () => {
      if (window.confirm(`Remove ${name} from ${snapshot.environment}? This disables the flag.`)) mutate(name, undefined, true);
    });
    actions.append(toggle, remove);
    row.append(details, actions);
    list.append(row);
  }
  if (!Object.keys(snapshot.flags).length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'No flags saved. Add bulkDiscount to try the pricing feature.';
    list.append(empty);
  }
}
async function refresh() {
  const [state, metadata] = await Promise.all([request('/api/admin/flags'), request('/version')]);
  snapshot = state;
  $('#environment').textContent = state.environment;
  $('#version').textContent = `v${metadata.version}`;
  const recorded = (value) => value && value !== 'unknown' ? value : 'Not recorded';
  $('#release-identity').textContent = metadata.releaseIdentity === 'unreleased'
    ? 'Unreleased' : recorded(metadata.releaseIdentity);
  const commit = recorded(metadata.commitSha);
  $('#commit-sha').textContent = commit === 'Not recorded' ? commit : commit.slice(0, 7);
  $('#commit-sha').title = commit;
  $('#build-run').textContent = recorded(metadata.buildRunId);
  $('#image-digest').textContent = recorded(metadata.imageDigest);
  $('#fault-mode').textContent = metadata.demoFault === 'none'
    ? 'Normal pricing mode. This preview does not record formal QA evidence.'
    : 'Demo boundary defect is active: inspect the price at exactly 5 items. Formal QA should catch it.';
  render();
}
async function mutate(name, enabled, remove = false) {
  if (busy) return;
  controls(true);
  try {
    await request(`/api/admin/flags/${encodeURIComponent(name)}`, {
      method: remove ? 'DELETE' : 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'ReleaseLab', 'If-Match': String(snapshot.revision) },
      ...(remove ? {} : { body: JSON.stringify({ enabled }) })
    });
    await refresh();
    $('#quote-result').textContent = 'Settings changed. Calculate again to see the current price.';
    status(`${name} ${remove ? 'removed' : enabled ? 'enabled' : 'disabled'}. Revalidate QA for the new configuration.`);
  } catch (error) {
    status(error.message, true);
  } finally { controls(false); }
}
$('#add-flag').addEventListener('submit', (event) => {
  event.preventDefault();
  const name = $('#flag-name').value.trim();
  if (snapshot && Object.hasOwn(snapshot.flags, name)) { status('That flag already exists. Use its switch.', true); return; }
  mutate(name, false).then(() => { $('#flag-name').value = ''; });
});
$('#quote-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const quote = await request('/api/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quantity: Number($('#quantity').value) }) });
    const money = (cents) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
    const total = document.createElement('strong');
    total.textContent = money(quote.totalCents);
    const detail = document.createElement('span');
    detail.textContent = `Subtotal ${money(quote.subtotalCents)} · Discount ${money(quote.discountCents)}`;
    $('#quote-result').replaceChildren(total, detail);
  } catch (error) { status(error.message, true); }
});
$('#refresh').addEventListener('click', async () => {
  controls(true);
  try { await refresh(); status('Current configuration loaded.'); }
  catch (error) { status(error.message, true); }
  finally { controls(false); }
});
controls(true);
refresh().catch((error) => status(error.message, true)).finally(() => controls(false));
