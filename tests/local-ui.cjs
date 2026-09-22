/* Offline UI regression tests. All requests are mocked; no mail or tracking. */
'use strict';
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { runInNewContext } = require('node:vm');
const assert = require('node:assert/strict');
const root = resolve(__dirname, '..');

function element(value = '') {
  return {
    value, hidden: false, textContent: '', disabled: false, checked: false,
    attributes: {}, listeners: {}, dataset: {},
    addEventListener(type, fn) { this.listeners[type] = fn; },
    setAttribute(key, val) { this.attributes[key] = val; },
    removeAttribute(key) { delete this.attributes[key]; },
    focus() { this.focused = true; },
    reportValidity() { return true; }
  };
}

function contact(fetch) {
  const ids = Object.fromEntries(['year', 'leadForm', 'submitBtn', 'formError',
    'formSuccess', 'lfName', 'lfMail', 'lfTel', 'lfObj', 'lfOrt', 'lfMsg'].map(id => [id, element()]));
  Object.assign(ids.lfName, { value: ' Test Person ' });
  ids.lfMail.value = 'test@example.invalid';
  ids.lfObj.value = 'Eigentumswohnung';
  ids.lfOrt.value = 'Kauf / Verkauf';
  ids.leadForm.dataset.region = 'Isernhagen';
  ids.submitBtn.textContent = 'Erstgespräch anfragen';
  ids.formSuccess.hidden = true;
  let timeout;
  runInNewContext(readFileSync(resolve(root, 'assets/local-contact.js'), 'utf8'), {
    document: { getElementById: id => ids[id] }, fetch, AbortController, Date,
    setTimeout: fn => { timeout = fn; return 1; }, clearTimeout() {}
  });
  return { ids, submit: () => ids.leadForm.listeners.submit({ preventDefault() {} }),
    expire: () => timeout() };
}

(async () => {
  let calls = 0;
  const successful = contact(async (url, options) => {
    calls++;
    assert.equal(url, '/api/contact');
    assert.equal(options.method, 'POST');
    const body = JSON.parse(options.body);
    assert.equal(body.name, 'Test Person');
    assert.equal(body.anlass, 'Isernhagen – Kauf / Verkauf');
    assert.equal(body.email, 'test@example.invalid');
    return { ok: true, json: async () => ({ ok: true }) };
  });
  const pending = successful.submit();
  assert.equal(successful.ids.submitBtn.disabled, true);
  await successful.submit();
  assert.equal(calls, 1, 'double submit must not send twice');
  await pending;
  assert.equal(successful.ids.leadForm.hidden, true);
  assert.equal(successful.ids.formSuccess.hidden, false);
  assert.equal(successful.ids.formSuccess.focused, true);
  assert.equal(successful.ids.submitBtn.disabled, false);
  assert.equal(successful.ids.leadForm.attributes['aria-busy'], undefined);
  console.log('PASS contact: confirmed success, trimmed payload, focus, double-submit guard');

  const failures = [
    async () => ({ ok: false, json: async () => ({ ok: false }) }),
    async () => ({ ok: true, json: async () => ({ ok: false }) }),
    async () => ({ ok: true, json: async () => { throw new SyntaxError('invalid JSON'); } }),
    async () => { throw new Error('offline'); }
  ];
  for (const fetch of failures) {
    const view = contact(fetch);
    await view.submit();
    assert.equal(view.ids.leadForm.hidden, false);
    assert.equal(view.ids.formSuccess.hidden, true);
    assert.equal(view.ids.formError.hidden, false);
    assert.equal(view.ids.formError.focused, true);
    assert.equal(view.ids.lfMail.value, 'test@example.invalid');
    assert.equal(view.ids.submitBtn.textContent, 'Erstgespräch anfragen');
    assert.equal(view.ids.submitBtn.disabled, false);
  }
  const timedOut = contact((url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new Error('aborted')));
  }));
  const waiting = timedOut.submit();
  timedOut.expire();
  await waiting;
  assert.equal(timedOut.ids.formError.hidden, false);
  console.log('PASS contact: HTTP failure, ok:false, invalid JSON, network failure, timeout');

  const invalid = contact(async () => { throw new Error('must not fetch'); });
  invalid.ids.lfName.value = '  ';
  await invalid.submit();
  assert.match(invalid.ids.formError.textContent, /Namen/);
  invalid.ids.leadForm.reportValidity = () => false;
  await invalid.submit();
  console.log('PASS contact: whitespace and native validation');

  const checkboxes = Array.from({ length: 17 }, () => element());
  const progress = element();
  const print = element();
  const reset = element();
  const tools = element();
  tools.hidden = true;
  let printed = 0;
  const ids = { 'check-progress': progress, 'print-checklist': print, 'reset-checklist': reset };
  runInNewContext(readFileSync(resolve(root, 'assets/checklist.js'), 'utf8'), {
    document: { querySelectorAll: () => checkboxes, getElementById: id => ids[id],
      querySelector: () => tools }, window: { print: () => printed++ }
  });
  assert.equal(tools.hidden, false);
  assert.match(progress.textContent, /0 von 17/);
  checkboxes[0].checked = true;
  checkboxes[0].listeners.change();
  assert.match(progress.textContent, /1 von 17/);
  print.listeners.click();
  assert.equal(printed, 1);
  reset.listeners.click();
  assert(checkboxes.every(box => !box.checked));
  assert.match(progress.textContent, /0 von 17/);
  console.log('PASS checklist: count, accessible progress, print action, reset');
})().catch(err => { console.error(err); process.exitCode = 1; });
