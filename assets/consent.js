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

  // ─── Meta-Pixel (Facebook / Instagram) ────────────────────
  // Ohne Pixel kann Meta die Kampagne nicht auf Anfragen optimieren:
  // Der Algorithmus lernt dann nur, wer *klickt*, nicht wer *anfragt*.
  // Genau das erzeugt viele Klicks bei kaum Leads.
  //
  // EINRICHTEN: Pixel-ID im Meta Events Manager kopieren
  // (Events Manager -> Datenquellen -> Pixel -> ID, 15-16 Ziffern)
  // und unten eintragen. Bis dahin bleibt der Pixel inaktiv.
  var META_PIXEL_ID = '28092479200415522'; // Datensatz "3D Immobilienbewertung Web"

  function ladeMetaPixel() {
    if (!META_PIXEL_ID) return;
    /* eslint-disable */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    // Erst nach Einwilligung Cookies setzen; vorher laeuft der Pixel
    // im eingeschraenkten Modus.
    var c = getConsent();
    if (!c || !c.analytics) { try { fbq('consent', 'revoke'); } catch (e) {} }
    fbq('init', META_PIXEL_ID);
    fbq('track', 'PageView');
  }
  ladeMetaPixel();

  // Meldet ein Ereignis an alle vorhandenen Messsysteme gleichzeitig.
  // metaName darf null sein, wenn nur GA4 gemeint ist.
  function meldeEreignis(gaName, metaName, daten, optionen) {
    try { gtag('event', gaName, daten || {}); } catch (e) {}
    try {
      if (window.fbq && metaName) {
        var istStandard = ['Lead', 'Contact', 'ViewContent', 'InitiateCheckout',
          'CompleteRegistration', 'Schedule', 'SubmitApplication', 'Search'].indexOf(metaName) > -1;
        fbq(istStandard ? 'track' : 'trackCustom', metaName, daten || {}, optionen || {});
      }
    } catch (e) {}
  }
  window.trackLead = meldeEreignis;

  // Eindeutige Ereignis-ID: Browser-Pixel und Server melden denselben
  // Lead: Meta erkennt am gleichen Wert das Duplikat und zaehlt einmal.
  window.neueEventId = function () {
    try {
      if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    } catch (e) {}
    return 'ev-' + Date.now() + '-' + Math.floor(Math.random() * 1e9);
  };

  // Die Meta-Cookies muessen an den Server weitergereicht werden, sonst
  // kann die Conversions API den Nutzer nicht der Anzeige zuordnen.
  window.metaCookies = function () {
    return { fbp: getCookie('_fbp') || '', fbc: getCookie('_fbc') || '' };
  };

  // ─── Lead-Event-Tracking (Schlüsselereignisse) ────────────
  // Misst echte Lead-Aktionen statt nur Seitenaufrufe. Consent Mode v2
  // regelt die DSGVO-konforme (cookieless bei Ablehnung) Erhebung automatisch.
  //   • generate_lead  → jeder erfolgreiche Formular-/Funnel-Versand (HTTP 200 von /api/contact)
  //   • phone_call     → Klick auf eine Telefonnummer (Anruf-Intent), auf allen Seiten
  (function () {
    // 1) Formular-Leads: erfolgreicher POST an /api/contact.
    //    Der Abfangmechanismus reichert JEDE Anfrage um Ereignis-ID und
    //    Meta-Cookies an - damit funktionieren Deduplizierung und
    //    Conversions API auch auf den aelteren Formularseiten, ohne dass
    //    dort etwas geaendert werden muss.
    if (window.fetch) {
      var _origFetch = window.fetch;
      window.fetch = function (input, init) {
        var url = (typeof input === 'string') ? input : (input && input.url) || '';
        var istLead = url.indexOf('/api/contact') !== -1;
        var eventId = null;

        if (istLead && init && typeof init.body === 'string') {
          try {
            var nutzlast = JSON.parse(init.body);
            eventId = nutzlast.eventId || window.neueEventId();
            var ck = window.metaCookies();
            nutzlast.eventId = eventId;
            nutzlast.fbp = nutzlast.fbp || ck.fbp;
            nutzlast.fbc = nutzlast.fbc || ck.fbc;
            nutzlast.seite = nutzlast.seite || location.href;
            init = Object.assign({}, init, { body: JSON.stringify(nutzlast) });
            arguments[1] = init;
          } catch (e) { /* kein JSON-Koerper: unveraendert weiterreichen */ }
        }

        return _origFetch.call(this, input, init).then(function (res) {
          if (istLead && res && res.ok) {
            // Meta braucht dieses Ereignis, um die Kampagne auf Anfragen
            // statt auf Klicks zu optimieren.
            meldeEreignis('generate_lead', 'Lead',
              { lead_source: location.pathname },
              eventId ? { eventID: eventId } : undefined);
          }
          return res;
        });
      };
    }
    // 2) Click-Kontakt-Intents auf jeder Seite: Telefon, E-Mail, WhatsApp
    document.addEventListener('click', function (e) {
      var t = e.target;
      var a = (t && t.closest) ? t.closest('a[href]') : null;
      if (!a) return;
      var href = a.getAttribute('href') || '';
      try {
        if (href.indexOf('tel:') === 0) {
          // Ein Anruf ist bei diesem Geschaeft ein vollwertiger Lead
          meldeEreignis('phone_call', 'Contact',
            { phone_number: href.replace('tel:', ''), link_location: location.pathname });
        } else if (href.indexOf('mailto:info@3dimmobilienbewertung.de') === 0) {
          // nur Geschäfts-Mail – Behörden-Mail in der Datenschutzerklärung bleibt außen vor
          gtag('event', 'email_click', { link_location: location.pathname });
        } else if (href.indexOf('wa.me/') !== -1 || href.indexOf('api.whatsapp.com') !== -1) {
          gtag('event', 'whatsapp_click', { link_location: location.pathname });
        }
      } catch (e2) {}
    }, true);
  })();

  // ─── Update consent after user choice ─────────────────────
  function updateConsent(analyticsAllowed) {
    gtag('consent', 'update', {
      'analytics_storage': analyticsAllowed ? 'granted' : 'denied'
    });
    try {
      if (window.fbq) fbq('consent', analyticsAllowed ? 'grant' : 'revoke');
    } catch (e) {}
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
    '<div style="flex:1;min-width:200px;max-width:680px;">' +
    '<strong class="cb-titel" style="color:#10243D;font-size:15px;">Diese Website verwendet Cookies</strong>' +
    '<p class="cb-lang" style="margin-top:6px;line-height:1.55;color:#5C708A">' +
    'Wir verwenden technisch notwendige Cookies sowie – mit Ihrer Einwilligung – Google Analytics zur anonymisierten Nutzungsanalyse. ' +
    'Ihre Daten werden erst nach Zustimmung erhoben. ' +
    '<a href="/datenschutz.html" style="color:#16365C;font-weight:600;">Datenschutzerklärung</a>' +
    '</p>' +
    '<p class="cb-kurz" style="font-size:12.8px">' +
    'Anonyme Statistik nur mit Ihrer Zustimmung. ' +
    '<a href="/datenschutz.html" style="color:#16365C;font-weight:600;">Datenschutz</a>' +
    '</p></div>' +
    '<div class="cb-btns" style="display:flex;gap:10px;flex-shrink:0;flex-wrap:nowrap;">' +
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

  /* Auf dem Smartphone belegte der Banner rund 30 % des Bildschirms und
     verdeckte damit genau den Bereich, in dem der erste Handlungsaufruf
     und die Anrufleiste sitzen. Auf schmalen Displays wird er deshalb
     deutlich kompakter: kurzer Text, Knoepfe nebeneinander. Er sitzt
     ueber der Aktionsleiste, nicht auf ihr. */
  var bannerCSS =
    '#cookie-banner .cb-lang{display:block}' +
    '#cookie-banner .cb-kurz{display:none}' +
    '@media(max-width:600px){' +
    '#cookie-banner{padding:12px 16px calc(12px + env(safe-area-inset-bottom))!important;' +
    'gap:10px!important;bottom:74px!important;border-radius:14px 14px 0 0;' +
    'box-shadow:0 -6px 24px rgba(16,36,61,.16)!important}' +
    '#cookie-banner .cb-lang{display:none}' +
    '#cookie-banner .cb-kurz{display:block;line-height:1.45;color:#5C708A;margin-top:3px}' +
    '#cookie-banner .cb-titel{font-size:14px!important}' +
    '#cookie-banner .cb-btns{width:100%;gap:8px!important}' +
    '#cookie-banner .cb-btns button{flex:1;padding:12px 10px!important;font-size:13.5px!important}' +
    '}';

  // ─── Show / Hide banner ────────────────────────────────────
  function showBanner() {
    var stil = document.createElement('style');
    stil.textContent = bannerCSS;
    document.head.appendChild(stil);

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
