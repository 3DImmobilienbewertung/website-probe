/* RND inquiry: no model-derived tax promise and no personal data in analytics. */
(function () {
  'use strict';
  var form = document.getElementById('leadForm');
  if (!form) return;
  var step = 1, busy = false, completed = false, lastNavigation = 0;
  var previousPayload = '', requestId = '';
  var fields = Array.from(form.querySelectorAll('fieldset'));
  var error = document.getElementById('formError');
  var next = document.getElementById('next'), back = document.getElementById('back');
  var submit = document.getElementById('submit');
  var labels = ['Nutzung', 'Gebäude', 'Situation', 'Rückruf'];
  var usageLabels = {vermietet:'Vollständig vermietet', teilweise:'Teilweise vermietet', betrieblich:'Betrieblich genutzt', geplant:'Vermietung konkret geplant', privat:'Ausschließlich privat selbst genutzt'};
  var summaryFields = [['objekt','Immobilienart'], ['baujahr','Baujahr'], ['ort','Objekt-PLZ'], ['eigentum','Eigentum / Anlass'], ['zustand','Modernisierung']];
  function value(id) { return document.getElementById(id).value.trim(); }
  function usage() { var input = form.querySelector('[name="nutzung"]:checked'); return input ? input.value : ''; }
  function track(name, data) { if (window.rndMeasurement) window.rndMeasurement.event(name, data || {}); }
  function showError(message, input) {
    error.textContent = message;
    error.hidden = false;
    if (input) { input.setAttribute('aria-invalid', 'true'); input.focus(); }
  }
  function valid(n) {
    if (n === 1 && (!usage() || usage() === 'privat')) {
      showError(usage() === 'privat' ? 'Diese Anfrage richtet sich an vermietete oder betrieblich genutzte Immobilien. Bitte prüfen Sie Ihre Auswahl.' : 'Bitte wählen Sie eine Nutzung aus.', form.querySelector('[name="nutzung"]'));
      return false;
    }
    var inputs = fields[n - 1].querySelectorAll('input:not([type=radio]), select');
    for (var input of inputs) {
      if (input.id === 'website') continue;
      input.setCustomValidity('');
      if (input.required && !input.value.trim()) input.setCustomValidity('Bitte füllen Sie dieses Pflichtfeld aus.');
      if (input.id === 'ort' && (!/^\d{5}$/.test(input.value.trim()) || input.value === '00000')) input.setCustomValidity('Bitte geben Sie eine fünfstellige deutsche Postleitzahl ein.');
      if (input.id === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim())) input.setCustomValidity('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
      if (input.id === 'phone' && (!/^[+\d\s()/.-]+$/.test(input.value.trim()) || !/^\d{7,15}$/.test(input.value.replace(/\D/g, '')))) input.setCustomValidity('Bitte geben Sie eine Telefonnummer mit Vorwahl ein.');
      if (!input.checkValidity()) { showError(input.validationMessage, input); return false; }
    }
    return true;
  }
  function buildSummary() {
    var dl = document.getElementById('answerSummary');
    dl.replaceChildren();
    [['Nutzung', usageLabels[usage()]]].concat(summaryFields.map(function (field) { return [field[1], value(field[0])]; })).forEach(function (pair) {
      var dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = pair[0]; dd.textContent = pair[1]; dl.append(dt, dd);
    });
  }
  function show(n, focus) {
    step = n;
    fields.forEach(function (field, i) { field.hidden = i !== n - 1; });
    document.getElementById('stepLabel').textContent = 'Schritt ' + n + ' von 4 · ' + labels[n - 1];
    document.getElementById('progress').value = n;
    back.hidden = n === 1; next.hidden = n === 4; submit.hidden = n !== 4;
    next.disabled = n === 1 && usage() === 'privat';
    error.hidden = true;
    if (n === 4) buildSummary();
    if (focus) {
      fields[n - 1].querySelector('legend').focus({preventScroll:true});
      document.getElementById('anfrage').scrollIntoView({block:'start', behavior:'auto'});
      track('form_step', {step:n});
    }
  }
  next.addEventListener('click', function () {
    if (busy || Date.now() - lastNavigation < 350 || !valid(step)) return;
    lastNavigation = Date.now();
    if (step < 4) show(step + 1, true);
  });
  back.addEventListener('click', function () { if (!busy && step > 1) { lastNavigation = Date.now(); show(step - 1, true); } });
  var started = false;
  form.addEventListener('change', function () {
    if (!started) { started = true; track('form_start'); }
    document.getElementById('privateNote').hidden = usage() !== 'privat';
    next.disabled = step === 1 && usage() === 'privat';
    document.getElementById('yearNote').hidden = value('baujahr') !== '1985 oder jünger';
    document.getElementById('inheritanceNote').hidden = !value('eigentum').startsWith('Geerbt');
    // Keep the error area's geometry stable while an input loses focus.
    // Hiding it here moves "Weiter" between pointerdown and pointerup.
  });
  form.addEventListener('input', function (event) {
    event.target.removeAttribute('aria-invalid');
    if (event.target.setCustomValidity) event.target.setCustomValidity('');
  });
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (busy || completed) return;
    if (step < 4) { next.click(); return; }
    for (var n = 1; n <= 4; n++) {
      show(n, false);
      if (!valid(n)) return;
    }
    var data = {formId:'rnd-v2', name:value('name'), email:value('email'), phone:value('phone'), ort:value('ort'), objekt:value('objekt'), anlass:'Restnutzungsdauergutachten – Rückruf', website:value('website'), nutzung:usage(), baujahr:value('baujahr'), eigentum:value('eigentum'), zustand:value('zustand')};
    data.message = ['Nutzung: ' + usageLabels[data.nutzung]].concat(summaryFields.map(function (field) { return field[1] + ': ' + data[field[0]]; })).join('\n');
    if (window.rndMeasurement && window.rndMeasurement.proof) Object.assign(data, window.rndMeasurement.proof());
    // Same submission -> same email idempotency key on retry; changed data -> new request.
    var serialized = JSON.stringify(data);
    if (serialized !== previousPayload) { previousPayload = serialized; requestId = crypto.randomUUID(); }
    data.requestId = requestId;
    Object.assign(data, window.rndMeasurement ? window.rndMeasurement.submission(requestId) : {marketingConsent:false});
    busy = true; submit.disabled = true; back.disabled = true; submit.textContent = 'Anfrage wird gesendet …';
    fields.forEach(function (field) { field.disabled = true; });
    error.hidden = true;
    var controller = new AbortController(), timeout = setTimeout(function () { controller.abort(); }, 25000);
    try {
      var response = await fetch('/api/contact', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data), signal:controller.signal});
      var result = await response.json();
      if (!response.ok || result.ok !== true || result.accepted === false) throw new Error('Not accepted');
      completed = true; form.hidden = true;
      document.getElementById('confirmationNote').textContent = result.confirmationSent === false
        ? 'Die zusätzliche Bestätigungs-E-Mail konnte nicht versendet werden. Ihre Rückrufanfrage wurde trotzdem angenommen.'
        : 'Eine Eingangsbestätigung erhalten Sie zusätzlich per E-Mail.';
      document.getElementById('formSuccess').hidden = false;
      document.getElementById('formSuccess').focus();
      if (window.rndMeasurement) window.rndMeasurement.accepted(requestId, result);
    } catch (err) {
      showError('Die Zustellung konnte nicht bestätigt werden. Ihre Angaben bleiben erhalten. Sie können erneut senden oder uns direkt anrufen: ');
      var phone = document.createElement('a'); phone.href = 'tel:+491747445452'; phone.textContent = '+49 174 744 5452'; error.append(phone);
      track('form_error');
    } finally {
      clearTimeout(timeout); busy = false; submit.disabled = false; back.disabled = false;
      fields.forEach(function (field) { field.disabled = false; });
      submit.textContent = 'Kostenlosen Rückruf anfordern';
    }
  });
  // Only a fixed allowlist controls copy; no arbitrary URL content enters the DOM.
  var params = new URLSearchParams(location.search);
  var motive = (params.get('utm_content') || params.get('motiv') || '').toLowerCase();
  if (motive === 'erbe') {
    document.querySelector('h1').textContent = 'Immobilie geerbt? AfA-Potenzial prüfen.';
    document.querySelector('.hero-sub').textContent = 'Eine Erbschaft startet die Abschreibung nicht automatisch neu. Wir prüfen kostenlos, ob eine Begutachtung der Restnutzungsdauer für Ihre vermietete oder künftig vermietete Immobilie sinnvoll sein kann.';
  }
  var mobileBar = document.querySelector('.mobile-bar');
  if ('IntersectionObserver' in window) new IntersectionObserver(function (entries) { mobileBar.classList.toggle('suppressed', entries[0].isIntersecting); }, {threshold:0}).observe(document.getElementById('anfrage'));
  form.hidden = false;
  show(1, false);
})();
