/* Shared contact UI for the two local service pages. No analytics or storage. */
(function () {
  'use strict';
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
  var form = document.getElementById('leadForm');
  if (!form) return;
  var button = document.getElementById('submitBtn');
  var error = document.getElementById('formError');
  var success = document.getElementById('formSuccess');
  var buttonLabel = button.textContent;
  var pending = false;

  function value(id) {
    return document.getElementById(id).value.trim();
  }
  function fail(message) {
    error.textContent = message;
    error.hidden = false;
    error.focus();
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (pending) return;
    if (!form.reportValidity()) return;
    error.hidden = true;
    if (!value('lfName') || !value('lfMail')) {
      fail('Bitte geben Sie Ihren Namen und Ihre E-Mail-Adresse an.');
      return;
    }
    pending = true;
    button.disabled = true;
    button.textContent = 'Wird gesendet …';
    form.setAttribute('aria-busy', 'true');
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 30000);
    try {
      var response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          name: value('lfName'),
          email: value('lfMail'),
          phone: value('lfTel'),
          objekt: value('lfObj'),
          anlass: form.dataset.region + ' – ' + value('lfOrt'),
          message: value('lfMsg') || 'Anfrage über die Standortseite ' + form.dataset.region
        })
      });
      var result = await response.json();
      if (!response.ok || result.ok !== true) {
        throw new Error('CONTACT_NOT_CONFIRMED');
      }
      form.hidden = true;
      success.hidden = false;
      success.focus();
    } catch (err) {
      fail('Wir konnten den Versand nicht bestätigen. Ihre Eingaben bleiben erhalten. Bitte rufen Sie uns unter 0174 744 5452 an oder schreiben Sie an info@3dimmobilienbewertung.de. Bei einer Verbindungsunterbrechung kann die Anfrage trotzdem angekommen sein.');
    } finally {
      clearTimeout(timer);
      pending = false;
      button.disabled = false;
      button.textContent = buttonLabel;
      form.removeAttribute('aria-busy');
    }
  });
}());
