/* 3D consent v2: basic opt-in, purpose separation, RND-only Meta measurement.
 * No provider script before consent. Never replay events collected while denied.
 */
(function () {
  'use strict';
  if (window.__threeDConsentLoaded) return;
  window.__threeDConsentLoaded = true;
  var VERSION = '3dim-2026-09-10', KEY = '3dim_consent_v2', DAYS = 180;
  var GA_ID = 'G-XS9EQ5RSRC', META_ID = '2126043741457881';
  var RND_PATH = '/restnutzungsdauergutachten-hannover.html';
  var isRnd = location.pathname === RND_PATH;
  var isProduction = /^(www\.)?3dimmobilienbewertung\.de$/.test(location.hostname);
  // Preview and localhost remain provider-free. Tests inspect the same adapter.
  var providersAllowed = isProduction;
  var pending = new Map(), sent = new Set(), gaLoaded = false, metaLoaded = false;
  var banner, dialog, beforeDialog, expiryTimer, applied = {analytics:false, marketing:false};
  function uuid() { return crypto.randomUUID(); }
  function cookie(name) {
    var match = document.cookie.split('; ').find(function (part) { return part.startsWith(name + '='); });
    if (!match) return '';
    try { return decodeURIComponent(match.slice(name.length + 1)); } catch (_) { return ''; }
  }
  function read() {
    try {
      var c = JSON.parse(cookie(KEY));
      if (c.version !== VERSION || typeof c.analytics !== 'boolean' || typeof c.marketing !== 'boolean' ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(c.id || '') || !Number.isFinite(c.at) ||
          Date.now() - c.at > DAYS * 864e5 || c.at > Date.now() + 300000) return null;
      return c;
    } catch (_) { return null; }
  }
  function write(c) {
    document.cookie = KEY + '=' + encodeURIComponent(JSON.stringify(c)) + ';path=/;max-age=' + DAYS * 86400 + ';SameSite=Lax' + (location.protocol === 'https:' ? ';Secure' : '');
  }
  var state = read();
  function allowed(purpose) { return !!state && state[purpose] === true && state.version === VERSION && Date.now() - state.at < DAYS * 864e5; }
  function clearCookies(pattern) {
    document.cookie.split(';').forEach(function (part) {
      var name = part.trim().split('=')[0];
      if (!pattern.test(name)) return;
      var domains = ['', location.hostname, '.' + location.hostname];
      if (isProduction) domains.push('.3dimmobilienbewertung.de', '3dimmobilienbewertung.de');
      domains.forEach(function (domain) {
        document.cookie = name + '=;Max-Age=0;path=/;SameSite=Lax' + (domain ? ';domain=' + domain : '');
      });
    });
  }
  function rawGtag() { window.dataLayer.push(arguments); }
  function safePage() { return location.origin + location.pathname; }
  function gaEvent(name, details) {
    if (!providersAllowed || !allowed('analytics') || !gaLoaded) return;
    var permitted = ['form_start', 'form_step', 'form_error', 'phone_click', 'email_click', 'video_start', 'generate_lead'];
    if (permitted.indexOf(name) < 0) return;
    var data = {page_location:safePage(), page_referrer:'', form_name:isRnd ? 'rnd' : 'contact', send_to:GA_ID};
    if (details && Number.isInteger(details.step) && details.step >= 1 && details.step <= 4) data.step = details.step;
    rawGtag('event', name, data);
  }
  function loadGA() {
    if (!providersAllowed || !allowed('analytics')) return;
    window['ga-disable-' + GA_ID] = false;
    if (gaLoaded) return;
    gaLoaded = true;
    window.dataLayer = [];
    rawGtag('consent', 'default', {analytics_storage:'denied', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'});
    rawGtag('consent', 'update', {analytics_storage:'granted', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'});
    rawGtag('js', new Date());
    rawGtag('config', GA_ID, {send_page_view:false, allow_google_signals:false, allow_ad_personalization_signals:false, page_location:safePage(), page_referrer:'', cookie_expires:180 * 86400, cookie_update:false});
    rawGtag('event', 'page_view', {send_to:GA_ID, page_location:safePage(), page_referrer:''});
    var script = document.createElement('script'); script.id = 'threeDGA'; script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.append(script);
  }
  function loadMeta() {
    if (!providersAllowed || !isRnd || !allowed('marketing')) return;
    if (metaLoaded) { if (window.fbq) window.fbq('consent', 'grant'); return; }
    metaLoaded = true;
    var fbq = function () { fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments); };
    fbq.push = fbq; fbq.loaded = true; fbq.version = '2.0'; fbq.queue = [];
    window.fbq = fbq; window._fbq = fbq;
    fbq('consent', 'grant');
    fbq('set', 'autoConfig', false, META_ID);
    // No automatic advanced matching: contact fields never enter the browser pixel.
    fbq('init', META_ID);
    fbq('trackSingle', META_ID, 'PageView');
    var script = document.createElement('script'); script.id = 'threeDMeta'; script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js'; document.head.append(script);
  }
  function apply() {
    if (allowed('analytics')) {
      if (!applied.analytics && gaLoaded) { window['ga-disable-' + GA_ID] = false; rawGtag('consent', 'update', {analytics_storage:'granted'}); }
      loadGA();
    } else {
      window['ga-disable-' + GA_ID] = true;
      // Block own calls first; discard still-pending commands on revocation.
      if (gaLoaded) { window.dataLayer.length = 0; rawGtag('consent', 'update', {analytics_storage:'denied', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'}); }
      clearCookies(/^(_ga(?:_|$)|_gid$|_gat(?:_|$))/);
    }
    if (allowed('marketing')) loadMeta();
    else {
      if (window.fbq) { if (Array.isArray(window.fbq.queue)) window.fbq.queue.length = 0; window.fbq('consent', 'revoke'); }
      clearCookies(/^_fb[pc]$/);
    }
    applied = {analytics:allowed('analytics'), marketing:allowed('marketing')};
    clearTimeout(expiryTimer);
    if (state) expiryTimer = setTimeout(function () {
      state=read(); apply(); if (banner) banner.hidden=!!state;
    }, Math.min(Math.max(1, DAYS * 864e5 - (Date.now() - state.at) + 1), 2147483000));
  }
  function select(analytics, marketing) {
    state = {version:VERSION, id:uuid(), at:Date.now(), analytics:analytics === true, marketing:marketing === true};
    write(state); apply(); if (banner) banner.hidden = true;
    if (dialog && dialog.open) dialog.close();
    if (channel) channel.postMessage('changed');
    document.dispatchEvent(new CustomEvent('threeDConsentChanged', {detail:{analytics:allowed('analytics'), marketing:allowed('marketing')}}));
  }
  function proof() {
    var data = {marketingConsent:isRnd && providersAllowed && allowed('marketing'), analyticsConsent:providersAllowed && allowed('analytics')};
    if (state) { data.consentVersion=VERSION; data.consentId=state.id; data.consentAt=state.at; }
    return data;
  }
  function metadata(id) {
    var c = state;
    var marketing = isRnd && providersAllowed && allowed('marketing');
    var analytics = providersAllowed && allowed('analytics');
    pending.set(id, {marketing:marketing, analytics:analytics, consentId:c ? c.id : ''});
    var data = proof();
    if (marketing) {
      data.eventId = id;
      data.fbp = cookie('_fbp');
      data.fbc = cookie('_fbc');
      // Only after opt-in. The click ID is an advertising identifier, not form data.
      var clickId = new URLSearchParams(location.search).get('fbclid');
      if (!data.fbc && /^[A-Za-z0-9._-]{1,500}$/.test(clickId || '')) data.fbc = 'fb.1.' + Date.now() + '.' + clickId;
      data.seite = location.origin + RND_PATH;
    }
    return data;
  }
  function accepted(id, result) {
    var attempt = pending.get(id);
    pending.delete(id);
    if (!attempt || sent.has(id) || !state || attempt.consentId !== state.id || (result && (result.testMode || result.ok === false || result.accepted === false))) return;
    sent.add(id);
    if (attempt.analytics && allowed('analytics')) gaEvent('generate_lead');
    if (attempt.marketing && allowed('marketing') && providersAllowed && isRnd && window.fbq) {
      window.fbq('trackSingle', META_ID, 'Lead', {}, {eventID:id});
    }
  }
  window.rndMeasurement = Object.freeze({event:gaEvent, proof:proof, submission:metadata, accepted:accepted});
  // Compatibility for older pages: ignore manual Lead events, which would double-count.
  window.gtag = function (command, name, data) {
    if (command === 'event' && name !== 'generate_lead') gaEvent(name, data);
  };
  window.trackLead = function (gaName) { if (gaName !== 'generate_lead') gaEvent(gaName); };
  window.neueEventId = uuid;
  window.metaCookies = function () { return allowed('marketing') && isRnd && providersAllowed ? {fbp:cookie('_fbp'),fbc:cookie('_fbc')} : {fbp:'',fbc:''}; };
  // Exact same-origin endpoint only. Never intercept unrelated URLs containing /api/contact.
  var nativeFetch = window.fetch;
  if (nativeFetch) window.fetch = function (input, init) {
    var target;
    try { target = new URL(typeof input === 'string' ? input : input.url, location.href); } catch (_) { return nativeFetch.apply(this, arguments); }
    var payload;
    if (target.origin !== location.origin || target.pathname !== '/api/contact' || !init || String(init.method || '').toUpperCase() !== 'POST' || typeof init.body !== 'string') return nativeFetch.apply(this, arguments);
    try { payload = JSON.parse(init.body); } catch (_) { return nativeFetch.apply(this, arguments); }
    if (payload.formId === 'rnd-v2') return nativeFetch.apply(this, arguments);
    var id = uuid();
    Object.assign(payload, metadata(id), {marketingConsent:false});
    pending.get(id).marketing = false;
    delete payload.eventId; delete payload.fbp; delete payload.fbc; delete payload.seite;
    init = Object.assign({}, init, {body:JSON.stringify(payload)});
    return nativeFetch.call(this, input, init).then(function (response) {
      if (response.ok) response.clone().json().then(function (body) { if (body.ok === true && body.accepted !== false) accepted(id, body); }).catch(function () {});
      return response;
    });
  };
  function settings() {
    if (!dialog) return;
    dialog.querySelector('#consentAnalytics').checked = allowed('analytics');
    dialog.querySelector('#consentMarketing').checked = allowed('marketing');
    if (!dialog.open) { beforeDialog=document.activeElement; dialog.showModal(); }
  }
  var cmp = function (command) { if (!command || command === 'showUi') settings(); };
  cmp.showUi=settings; window.__cmp=cmp;
  var channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('threeDConsent') : null;
  function sync() { var latest = read(); if (JSON.stringify(latest) !== JSON.stringify(state)) { state=latest; apply(); if (banner) banner.hidden=!!state; } }
  if (channel) channel.onmessage=sync;
  window.addEventListener('focus', sync);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) sync(); });
  function init() {
    var style=document.createElement('link');style.rel='stylesheet';style.href='/assets/consent.css?v=20260910';document.head.append(style);
    banner=document.createElement('section');banner.id='cookie-banner';banner.className='cmp-banner';banner.setAttribute('aria-label','Cookie-Einwilligung');
    banner.innerHTML='<div><strong>Ihre Privatsphäre</strong><p>Statistik mit Google Analytics und Werbemessung mit Meta Pixel / Conversions API nur mit Ihrer Einwilligung. Dabei können Daten in die USA gelangen. Die Anfrage funktioniert auch ohne Tracking. <a href="/datenschutz.html#cookies">Details</a></p></div><div class="cmp-actions"><button type="button" data-choice="none">Alle ablehnen</button><button type="button" data-choice="settings">Auswahl</button><button type="button" data-choice="all">Alle akzeptieren</button></div>';
    banner.hidden=!!state;document.body.append(banner);
    dialog=document.createElement('dialog');dialog.className='cmp-dialog';dialog.id='consent-dialog';dialog.setAttribute('aria-labelledby','consentTitle');
    dialog.innerHTML='<h2 id="consentTitle">Cookie-Einstellungen</h2><p>Sie entscheiden getrennt über die Zwecke. Ein Widerruf ist jederzeit hier möglich und gilt für künftige Verarbeitungen.</p><div class="cmp-purpose"><strong>Notwendig · immer aktiv</strong><p>Speichert Ihre Auswahl für 180 Tage. Dafür werden keine Analyse- oder Marketingdienste benötigt.</p></div><label class="cmp-purpose"><span><strong>Statistik – Google Analytics 4</strong><span>Google Ireland Limited. Seitenaufrufe und allgemeine Formularschritte zur Verbesserung der Website; keine Kontakt- oder Objektangaben. Verarbeitung auch in den USA.</span></span><input id="consentAnalytics" type="checkbox"></label><label class="cmp-purpose"><span><strong>Werbemessung – Meta Pixel / Conversions API</strong><span>Meta Platforms Ireland Limited. Nur auf der Restnutzungsdauer-Seite: Seitenaufrufe und erfolgreiche Anfragen zur Anzeigenzuordnung und -optimierung. Mit Zustimmung werden Werbe-Kennungen, IP-/Browserdaten und serverseitig gehashte E-Mail/Telefonnummer übermittelt. Meta kann Daten einem Konto zuordnen; Verarbeitung auch in den USA.</span></span><input id="consentMarketing" type="checkbox"></label><p><a href="/datenschutz.html#meta">Empfänger, Datenflüsse und Ihre Rechte</a></p><div class="cmp-actions"><button type="button" data-choice="none">Alle ablehnen</button><button type="button" data-choice="save">Auswahl speichern</button><button type="button" data-choice="all">Alle akzeptieren</button></div><button type="button" class="cmp-close">Schließen ohne Änderung</button>';
    document.body.append(dialog);
    function click(event) {
      var button=event.target.closest('button');if (!button) return;
      var choice=button.dataset.choice;
      if (choice === 'none') select(false,false);
      if (choice === 'all') select(true,true);
      if (choice === 'settings') settings();
      if (choice === 'save') select(dialog.querySelector('#consentAnalytics').checked,dialog.querySelector('#consentMarketing').checked);
      if (button.classList.contains('cmp-close')) dialog.close();
    }
    banner.addEventListener('click',click);dialog.addEventListener('click',click);
    dialog.addEventListener('close',function(){if (beforeDialog && beforeDialog.isConnected) beforeDialog.focus();});
    document.querySelectorAll('#cookieSettings,[data-consent-settings]').forEach(function(button){button.addEventListener('click',settings);});
    // A persistent reopening control on older pages without a footer control.
    if (!document.querySelector('#cookieSettings,[data-consent-settings],.consent-btn')) {
      var reopen=document.createElement('button');reopen.type='button';reopen.className='cmp-reopen';reopen.textContent='Cookies';reopen.addEventListener('click',settings);document.body.append(reopen);
    }
    document.addEventListener('click',function(event){
      var link=event.target.closest('a[href]');if(!link)return;
      var href=link.getAttribute('href');
      if(href.startsWith('tel:'))gaEvent('phone_click');
      if(href.startsWith('mailto:info@3dimmobilienbewertung.de'))gaEvent('email_click');
    });
    apply();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
