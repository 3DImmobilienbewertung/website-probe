/* Four-step enquiry; existing /api/contact contract and fetch instrumentation. */
(() => {
  'use strict';
  const card = document.querySelector('.wc-card');
  if (!card) return;
  const get = id => document.getElementById(id);
  const steps = [...card.querySelectorAll('.wc-step')];
  const options = [...card.querySelectorAll('.wc-opt')];
  const back = [...card.querySelectorAll('[data-back]')];
  const submit = get('wcSubmit');
  const error = get('wcError');
  const progress = card.querySelector('[role="progressbar"]');
  const names = ['Immobilie', 'Anlass', 'Ort & Zeitpunkt', 'Kontakt'];
  const values = { objekt: '', anlass: '', ort: '', zeitrahmen: '' };
  let current = 1;
  let pending = false;

  steps.forEach(step => {
    const heading = step.querySelector('.wc-q, h3');
    if (heading) heading.setAttribute('tabindex', '-1');
  });
  function show(number, focus = true) {
    current = number;
    for (const step of steps) {
      const active = step.dataset.step === String(number);
      step.classList.toggle('active', active);
      step.hidden = !active;
      if (active && focus) step.querySelector('.wc-q, h3')?.focus({ preventScroll: true });
    }
    const done = number === 'done';
    get('wcBar').style.width = (done ? 100 : number / 4 * 100) + '%';
    get('wcLbl').textContent = done ? 'Anfrage erfolgreich übermittelt' : `Schritt ${number} / 4 · ${names[number - 1]}`;
    progress.setAttribute('aria-valuenow', done ? '4' : String(number));
    progress.setAttribute('aria-valuetext', get('wcLbl').textContent);
    options.forEach(option => option.setAttribute('aria-pressed', String(values[option.dataset.field] === option.dataset.val)));
    if (number === 4) get('wcSummary').textContent = [values.objekt, values.anlass, values.ort, values.zeitrahmen].filter(Boolean).join(' · ');
  }
  options.forEach(option => option.addEventListener('click', () => {
    if (pending) return;
    values[option.dataset.field] = option.dataset.val;
    show(current + 1);
  }));
  back.forEach(button => button.addEventListener('click', () => { if (!pending) show(Math.max(1, current - 1)); }));
  function next() {
    values.ort = get('wcOrt').value.trim();
    values.zeitrahmen = get('wcZeit').value;
    show(4);
  }
  get('wcOrtNext').addEventListener('click', next);
  for (const id of ['wcName', 'wcMail']) get(id).addEventListener('input', () => get(id).setCustomValidity(''));

  async function send() {
    if (pending || current !== 4) return;
    const name = get('wcName');
    const mail = get('wcMail');
    name.setCustomValidity(name.value.trim() ? '' : 'Bitte geben Sie Ihren Namen an.');
    mail.setCustomValidity(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail.value.trim()) ? '' : 'Bitte geben Sie eine gültige E-Mail-Adresse an.');
    for (const field of [name, mail]) {
      if (!field.checkValidity()) { field.focus(); field.reportValidity(); return; }
    }
    pending = true;
    submit.disabled = true;
    back.forEach(button => { button.disabled = true; });
    error.hidden = true;
    card.setAttribute('aria-busy', 'true');
    submit.textContent = 'Anfrage wird gesendet …';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ name: name.value.trim(), email: mail.value.trim(), phone: get('wcTel').value.trim(), ...values, message: 'Erstgespräch-Anfrage über Gutachten-Vorab-Check' })
      });
      if (!response.ok) throw new Error('HTTP failure');
      const result = await response.json();
      if (result?.ok !== true) throw new Error('Unconfirmed delivery');
      show('done');
    } catch (_) {
      error.textContent = 'Wir konnten die Übermittlung nicht bestätigen. Ihre Eingaben bleiben erhalten. Bitte versuchen Sie es erneut oder rufen Sie uns unter 0174 744 5452 an.';
      error.hidden = false;
      error.focus({ preventScroll: true });
    } finally {
      clearTimeout(timer);
      pending = false;
      submit.disabled = false;
      back.forEach(button => { button.disabled = false; });
      submit.textContent = 'Kostenloses Erstgespräch anfragen';
      card.removeAttribute('aria-busy');
    }
  }
  submit.addEventListener('click', send);
  card.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.target.tagName !== 'INPUT') return;
    event.preventDefault();
    if (current === 3) next();
    else if (current === 4) send();
  });
  show(1, false);
})();
