/**
 * 3D Immobilienbewertung – Cookie Consent & Google Analytics
 * DSGVO-konform mit Google Consent Mode v2
 *
 * SETUP: Ersetzen Sie 'G-XXXXXXXXXX' durch Ihre echte Google Analytics 4 Mess-ID.
 * Diese finden Sie in Google Analytics unter: Verwaltung → Datenstreams → Mess-ID
 */

(function () {
  'use strict';

  var GA_ID = 'G-XS9EQ5RSRC'; // Google Analytics 4 – 3D Immobilienbewertung
  var CONSENT_KEY = '3dim_consent';
  var CONSENT_DURATION = 365; // Tage

  // ─── Helper ───────────────────────────────────────────────
  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  function setCookie(name, value, days) {
    var expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = name + '=' + value + ';expires=' + expires + ';path=/;SameSite=Lax';
  }

  function getConsent() {
    try { return JSON.parse(getCookie(CONSENT_KEY) || 'null'); } catch (e) { return null; }
  }

  // ─── Google Consent Mode v2 Default (blocked) ─────────────
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('consent', 'default', {
    'analytics_storage': 'denied',
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'wait_for_update': 500
  });

  // ─── Load GA4 (always, but blocked by consent) ────────────
  function loadGA() {
    if (!GA_ID || GA_ID === 'G-XXXXXXXXXX') return; // Noch keine ID gesetzt
    var s = document.createElement('script');
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    s.async = true;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GA_ID, { 'anonymize_ip': true });
  }
  loadGA();

  // ─── Update consent after user choice ─────────────────────
  function updateConsent(analyticsAllowed) {
    gtag('consent', 'update', {
      'analytics_storage': analyticsAllowed ? 'granted' : 'denied'
    });
    setCookie(CONSENT_KEY, JSON.stringify({ analytics: analyticsAllowed, ts: Date.now() }), CONSENT_DURATION);
  }

  // ─── Banner HTML ───────────────────────────────────────────
  var bannerHTML = '<div id="cookie-banner" style="' +
    'position:fixed;bottom:0;left:0;right:0;z-index:9999;' +
    'background:#fff;border-top:1px solid rgba(16,36,61,.12);' +
    'box-shadow:0 -8px 40px rgba(16,36,61,.12);' +
    'padding:20px 24px;display:flex;align-items:center;' +
    'justify-content:space-between;flex-wrap:wrap;gap:16px;' +
    'font-family:\'Hanken Grotesk\',sans-serif;font-size:14.5px;color:#2A445F;">' +
    '<div style="flex:1;min-width:240px;max-width:680px;">' +
    '<strong style="color:#10243D;font-size:15px;">🍪 Diese Website verwendet Cookies</strong>' +
    '<p style="margin-top:6px;line-height:1.55;color:#5C708A">' +
    'Wir verwenden technisch notwendige Cookies sowie – mit Ihrer Einwilligung – Google Analytics zur anonymisierten Nutzungsanalyse. ' +
    'Ihre Daten werden erst nach Zustimmung erhoben. ' +
    '<a href="/datenschutz.html" style="color:#16365C;font-weight:600;">Datenschutzerklärung</a>' +
    '</p></div>' +
    '<div style="display:flex;gap:10px;flex-shrink:0;flex-wrap:wrap;">' +
    '<button id="consent-decline" style="' +
    'padding:11px 20px;border:1.5px solid rgba(16,36,61,.2);border-radius:100px;' +
    'background:transparent;color:#5C708A;font-size:14px;font-weight:600;cursor:pointer;' +
    'font-family:inherit;white-space:nowrap;">' +
    'Nur notwendige' +
    '</button>' +
    '<button id="consent-accept" style="' +
    'padding:11px 22px;border:none;border-radius:100px;' +
    'background:#16365C;color:#fff;font-size:14px;font-weight:700;cursor:pointer;' +
    'font-family:inherit;white-space:nowrap;box-shadow:0 4px 16px rgba(22,54,92,.3);">' +
    'Alle akzeptieren ✓' +
    '</button>' +
    '</div>' +
    '</div>';

  // ─── Show / Hide banner ────────────────────────────────────
  function showBanner() {
    var wrap = document.createElement('div');
    wrap.innerHTML = bannerHTML;
    document.body.appendChild(wrap.firstChild);

    document.getElementById('consent-accept').addEventListener('click', function () {
      updateConsent(true);
      hideBanner();
    });
    document.getElementById('consent-decline').addEventListener('click', function () {
      updateConsent(false);
      hideBanner();
    });
  }

  function hideBanner() {
    var b = document.getElementById('cookie-banner');
    if (b) {
      b.style.transition = 'transform .3s ease, opacity .3s ease';
      b.style.transform = 'translateY(100%)';
      b.style.opacity = '0';
      setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 320);
    }
  }

  // ─── Init ─────────────────────────────────────────────────
  function init() {
    var stored = getConsent();
    if (stored !== null) {
      // Bereits entschieden – Consent wiederherstellen
      updateConsent(stored.analytics === true);
    } else {
      // Noch keine Entscheidung – Banner zeigen
      showBanner();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Öffentliche API für Datenschutz-Seite
  window.__cmp = { showUi: showBanner };

})();
