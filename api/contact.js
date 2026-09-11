// Kontakt-Endpunkt. Leitet Anfragen per Resend an das Postfach weiter und
// bestaetigt dem Interessenten den Eingang.
//
// Bei fehlgeschlagener Zustellung meldet das Formular einen Fehler und
// behält die Eingaben für einen erneuten Versuch. Keine Kontaktdaten in Logs.

const crypto = require('crypto');

const EMPFAENGER = ['info@3dimmobilienbewertung.de', 'vito.donn85@gmail.com'];
const ABSENDER = '3D Immobilienbewertung <anfrage@3dimmobilienbewertung.de>';
const CONSENT_VERSION = '3dim-2026-09-10';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function consentReceipt(body, req) {
  try {
    const entry = String(req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith('3dim_consent_v2='));
    const saved = JSON.parse(decodeURIComponent((entry || '').slice('3dim_consent_v2='.length)));
    if (saved.version !== CONSENT_VERSION || body.consentVersion !== saved.version ||
        !UUID.test(saved.id || '') || body.consentId !== saved.id || body.consentAt !== saved.at ||
        !Number.isFinite(saved.at) || saved.at > Date.now() + 300000 || Date.now() - saved.at > 180 * 864e5 ||
        typeof saved.analytics !== 'boolean' || typeof saved.marketing !== 'boolean') return null;
    return {version:saved.version, id:saved.id, at:saved.at,
      analytics:saved.analytics && body.analyticsConsent === true,
      marketing:saved.marketing && body.marketingConsent === true};
  } catch (_) { return null; }
}

// ─── Conversions API ────────────────────────────────────────────────
// CAPI darf eine fehlende oder abgelehnte Marketing-Einwilligung niemals
// umgehen. Nur explizite, versionierte Zustimmung kann den Versand erlauben.
//
// Beide Wege senden dieselbe event_id; Meta erkennt daran das Duplikat
// und zaehlt den Lead genau einmal.
//
// EINRICHTEN (Vercel -> Projekt -> Settings -> Environment Variables):
//   META_PIXEL_ID    = die Pixel-ID aus dem Events Manager
//   META_CAPI_TOKEN  = Events Manager -> Einstellungen -> Conversions API
//                      -> "Zugriffstoken generieren"
// Fehlt eine der beiden, wird der Versand still uebersprungen.

function hash(wert) {
  if (!wert) return undefined;
  return crypto.createHash('sha256')
    .update(String(wert).trim().toLowerCase())
    .digest('hex');
}

function telefonHash(nummer) {
  if (!nummer) return undefined;
  // Meta erwartet nur Ziffern inklusive Laendervorwahl
  let ziffern = String(nummer).replace(/[^\d]/g, '');
  if (ziffern.startsWith('00')) ziffern = ziffern.slice(2);
  else if (ziffern.startsWith('0')) ziffern = '49' + ziffern.slice(1);
  else if (!String(nummer).trim().startsWith('+')) return undefined;
  if (!/^\d{7,15}$/.test(ziffern)) return undefined;
  return crypto.createHash('sha256').update(ziffern).digest('hex');
}

async function sendeAnMeta(daten, req) {
  if (!daten.consent || daten.consent.marketing !== true) {
    return { uebersprungen: 'Keine ausdrückliche Marketing-Einwilligung' };
  }
  const pixel = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  if (!pixel || !token) return { uebersprungen: 'Pixel-ID oder Token fehlt' };
  if (daten.testMode && !process.env.META_TEST_EVENT_CODE) return {uebersprungen:'Testmodus ohne Meta-Testcode'};

  const nutzer = {
    em: hash(daten.email),
    ph: telefonHash(daten.phone),
    client_ip_address: (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || undefined,
    client_user_agent: req.headers['user-agent'] || undefined,
    fbp: /^fb\.[12]\.\d{13}\.[A-Za-z0-9._-]{1,500}$/.test(daten.fbp || '') ? daten.fbp : undefined,
    fbc: /^fb\.[12]\.\d{13}\.[A-Za-z0-9._-]{1,500}$/.test(daten.fbc || '') ? daten.fbc : undefined
  };
  Object.keys(nutzer).forEach(k => nutzer[k] === undefined && delete nutzer[k]);

  const koerper = {
    data: [{
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      event_id: daten.eventId || undefined,   // Deduplizierung mit dem Pixel
      event_source_url: 'https://www.3dimmobilienbewertung.de/restnutzungsdauergutachten-hannover.html',
      action_source: 'website',
      user_data: nutzer,
      custom_data: {
        content_name: 'Restnutzungsdauergutachten'
      }
    }]
  };
  if (daten.testMode) koerper.test_event_code = process.env.META_TEST_EVENT_CODE;

  const resp = await fetch(
    `https://graph.facebook.com/v21.0/${pixel}/events?access_token=${encodeURIComponent(token)}`,
    { method: 'POST', signal:AbortSignal.timeout(5000), headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(koerper) }
  );
  const text = await resp.text();
  if (!resp.ok) throw new Error(`Meta CAPI ${resp.status}: ${text}`);
  return JSON.parse(text);
}

function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function zeile(label, wert) {
  return `<tr><td style="padding:10px 0;color:#5c7088;font-size:14px;width:140px;border-bottom:1px solid #f0f4f8">${label}</td>` +
         `<td style="padding:10px 0;font-weight:600;color:#16365C;border-bottom:1px solid #f0f4f8">${wert || '&mdash;'}</td></tr>`;
}

async function sendeMail(apiKey, payload, idempotencyKey) {
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    signal: AbortSignal.timeout(10000),
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json',
      ...(idempotencyKey ? {'Idempotency-Key': idempotencyKey} : {}) },
    body: JSON.stringify(payload)
  });
  if (!resp.ok) throw new Error(`Resend ${resp.status}: ${await resp.text()}`);
  return resp.json();
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  // The forms post to their own host. No permissive cross-origin relay.
  const origin = req.headers.origin;
  if (origin) {
    try {
      if (new URL(origin).host !== req.headers.host) return res.status(403).json({error:'Origin not allowed'});
    } catch (_) { return res.status(403).json({error:'Origin not allowed'}); }
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const b = req.body || {};
  const { name, email, phone, objekt, anlass, ort, zeitrahmen, message, website } = b;
  // Tracking-Felder werden nie in die E-Mail uebernommen
  const { eventId, fbp, fbc, seite } = b;

  // Honeypot: echte Nutzer sehen das Feld nicht, Bots fuellen es aus.
  // Bots bekommen ein freundliches 200, damit sie nicht erneut probieren.
  if (website) return res.status(200).json({ ok: true, accepted: false });

  if (!name || !email) {
    return res.status(400).json({ error: 'Name und E-Mail sind Pflichtfelder.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim())) {
    return res.status(400).json({ error: 'Bitte eine gueltige E-Mail-Adresse angeben.' });
  }

  // Additional validation is scoped to the new RND funnel. Existing forms
  // retain their field contract. A PLZ is only a plausibility check, not geofencing.
  const isRnd = b.formId === 'rnd-v2';
  const consent = isRnd ? consentReceipt(b, req) : null;
  const testMode = isRnd && b.testMode === true && String(email).trim().toLowerCase() === EMPFAENGER[0];
  if (isRnd) {
    const allowed = {
      nutzung: ['vermietet', 'teilweise', 'betrieblich', 'geplant'],
      objekt: ['Mehrfamilienhaus', 'Ein- oder Zweifamilienhaus', 'Eigentumswohnung', 'Wohn- und Geschäftshaus', 'Gewerbeimmobilie'],
      baujahr: ['Vor 1925', '1925–1959', '1960–1974', '1975–1984', '1985 oder jünger', 'Weiß ich noch nicht'],
      eigentum: ['Bereits länger in meinem Eigentum', 'Kürzlich gekauft', 'Geerbt – Alleinerbe / Alleinerbin', 'Geerbt – Teil einer Erbengemeinschaft', 'Kauf geplant', 'Ich vertrete den Eigentümer'],
      zustand: ['Überwiegend ursprünglicher Zustand', 'Teilweise modernisiert', 'Umfassend modernisiert', 'Weiß ich noch nicht']
    };
    const phoneText = typeof phone === 'string' ? phone.trim() : '';
    const invalid = Object.entries(allowed).some(([key, values]) => !values.includes(b[key]));
    if (invalid || typeof name !== 'string' || !name.trim() || name.length > 120 ||
        typeof email !== 'string' || email.length > 254 ||
        typeof ort !== 'string' || !/^\d{5}$/.test(ort) || ort === '00000' ||
        phoneText.length > 30 || !/^[+\d\s()/.-]+$/.test(phoneText) || !/^\d{7,15}$/.test(phoneText.replace(/\D/g, '')) ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(b.requestId || '')) {
      return res.status(400).json({error:'Bitte prüfen Sie die Pflichtangaben zu Objekt und Rückruf.'});
    }
  }

  // Keep the Resend body stable across retries with the same idempotency key.
  const eingang = isRnd ? 'Rückrufanfrage über die Website' : new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });
  const quelle = isRnd ? 'Restnutzungsdauer-Landingpage' : (req.headers.referer || '—');

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;padding:24px;background:#f9fbff">
      <div style="background:#16365C;padding:24px 32px;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;margin:0;font-size:22px">Neue Anfrage${anlass ? ': ' + esc(anlass) : ''}</h1>
        <p style="color:#bcd6ff;margin:6px 0 0;font-size:14px">3D Immobilienbewertung &middot; ${esc(eingang)}</p>
      </div>
      <div style="background:#fff;padding:28px 32px;border:1px solid #e0e8f4;border-top:none;border-radius:0 0 12px 12px">
        <table style="width:100%;border-collapse:collapse">
          ${zeile('Name', esc(name))}
          ${zeile('E-Mail', `<a href="mailto:${esc(email)}" style="color:#16365C">${esc(email)}</a>`)}
          ${zeile('Telefon', phone ? `<a href="tel:${esc(String(phone).replace(/[^\d+]/g, ''))}" style="color:#16365C">${esc(phone)}</a>` : '')}
          ${zeile('Objektart', esc(objekt))}
          ${zeile('Anlass', esc(anlass))}
          ${zeile('Ort / PLZ', esc(ort))}
          ${zeile('Zeitrahmen', esc(zeitrahmen))}
          ${isRnd ? zeile('Mess-Einwilligung', consent ? esc('Statistik: ' + (consent.analytics ? 'ja' : 'nein') + '; Meta: ' + (consent.marketing ? 'ja' : 'nein') + '; ' + consent.version + '; ' + new Date(consent.at).toISOString() + '; ID ' + consent.id) : 'Keine nachgewiesene Einwilligung') : ''}
          ${isRnd ? zeile('Anfrage-ID', esc(b.requestId)) : ''}
          <tr><td style="padding:10px 0;color:#5c7088;font-size:14px;vertical-align:top">Angaben</td>
              <td style="padding:10px 0;color:#16365C">${esc(message || '—').replace(/\n/g, '<br>')}</td></tr>
        </table>
        <div style="margin-top:24px;padding:16px 20px;background:#f2f6fb;border-radius:8px">
          <p style="margin:0 0 6px;font-size:14px;color:#16365C;font-weight:700">Innerhalb von 24 Stunden antworten</p>
          <p style="margin:0;font-size:13px;color:#5c7088">
            <a href="mailto:${esc(email)}?subject=Ihre%20Anfrage%20bei%203D%20Immobilienbewertung" style="color:#16365C;font-weight:600">Per E-Mail antworten</a>
            ${phone ? ` &nbsp;&middot;&nbsp; <a href="tel:${esc(String(phone).replace(/[^\d+]/g, ''))}" style="color:#16365C;font-weight:600">Jetzt anrufen</a>` : ''}
          </p>
        </div>
        <p style="color:#94a5b8;font-size:11px;margin:18px 0 0">Eingegangen &uuml;ber ${esc(quelle)}</p>
      </div>
    </div>`;

  // Bestaetigung an den Interessenten: schafft Vertrauen und belegt dem
  // Absender, dass die Anfrage wirklich angekommen ist.
  const bestaetigung = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;padding:24px;background:#f9fbff">
      <div style="background:#16365C;padding:26px 32px;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;margin:0;font-size:21px">Ihre Anfrage ist angekommen</h1>
      </div>
      <div style="background:#fff;padding:30px 32px;border:1px solid #e0e8f4;border-top:none;border-radius:0 0 12px 12px;color:#2b3f56;line-height:1.65">
        <p style="margin:0 0 16px">Guten Tag ${esc(name)},</p>
        <p style="margin:0 0 16px">vielen Dank f&uuml;r Ihre Anfrage. Wir haben sie erhalten und melden uns
        <strong>innerhalb von 24&nbsp;Stunden</strong> pers&ouml;nlich bei Ihnen &ndash; mit einer ersten
        Einsch&auml;tzung und allen offenen Fragen zu Ihrem Objekt.</p>
        <p style="margin:0 0 16px">Wenn es eilig ist, erreichen Sie uns direkt unter
        <a href="tel:+491747445452" style="color:#16365C;font-weight:700">+49 174 744 5452</a>.</p>
        <div style="margin:22px 0;padding:16px 20px;background:#f2f6fb;border-left:3px solid #C9A227;border-radius:0 8px 8px 0">
          <p style="margin:0;font-size:14px;color:#5c7088">Ihre Angaben:<br>
          <span style="color:#16365C">${esc(message || objekt || 'Immobilienbewertung')}</span></p>
        </div>
        <p style="margin:0 0 4px">Herzliche Gr&uuml;&szlig;e</p>
        <p style="margin:0;font-weight:700;color:#16365C">Vito &amp; Nandino Donnarumma</p>
        <p style="margin:2px 0 0;font-size:13px;color:#5c7088">3D Immobilienbewertung &middot; Donnarumma &amp; Donnarumma GbR</p>
      </div>
      <p style="color:#b0bec5;font-size:11px;margin-top:14px;text-align:center">
        Diese Best&auml;tigung wurde automatisch versendet. Bitte antworten Sie einfach auf diese E-Mail, wenn Sie etwas erg&auml;nzen m&ouml;chten.</p>
    </div>`;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('Kontaktzustellung fehlgeschlagen: RESEND_API_KEY fehlt.');
    return res.status(500).json({ error: 'Konfigurationsfehler – API Key fehlt.' });
  }

  let ownerMail;
  try {
    ownerMail = await sendeMail(apiKey, {
      from: ABSENDER,
      to: EMPFAENGER,
      reply_to: String(email).trim(),
      subject: `${testMode ? '[TEST – KEIN KUNDENLEAD] ' : ''}Neue Anfrage: ${name} – ${anlass || objekt || 'Immobilienbewertung'}`,
      html
    }, isRnd ? 'rnd-' + b.requestId + '-owner' : undefined);
  } catch (err) {
    console.error('Kontaktzustellung fehlgeschlagen. Keine Kontaktdaten protokolliert.');
    return res.status(500).json({ error: 'E-Mail konnte nicht gesendet werden.' });
  }

  // Optional measurement is strictly independent of inquiry delivery.
  let capiStatus = 'skipped';
  try {
    const meta = await sendeAnMeta(
      { email, phone, eventId:isRnd ? b.requestId : eventId, fbp, fbc, consent, testMode }, req
    );
    if (meta && meta.uebersprungen) console.log('Meta CAPI übersprungen:', meta.uebersprungen);
    else capiStatus = meta && meta.events_received === 1 ? 'accepted' : 'unconfirmed';
  } catch (err) {
    capiStatus = 'failed';
    console.error('Meta CAPI fehlgeschlagen (Lead ist zugestellt).');
  }

  // Die Bestaetigung ist ein Bonus. Scheitert sie, ist der Lead trotzdem da –
  // deshalb darf sie die Antwort an den Browser nicht auf Fehler kippen.
  let confirmationMail, confirmationSent = false;
  try {
    confirmationMail = await sendeMail(apiKey, {
      from: ABSENDER,
      to: [String(email).trim()],
      reply_to: 'info@3dimmobilienbewertung.de',
      subject: (testMode ? '[TEST] ' : '') + 'Ihre Anfrage bei 3D Immobilienbewertung – wir melden uns in 24 Stunden',
      html: bestaetigung
    }, isRnd ? 'rnd-' + b.requestId + '-confirmation' : undefined);
    confirmationSent = true;
  } catch (err) {
    console.error('Bestaetigungsmail fehlgeschlagen (Lead ist zugestellt).');
  }

  if (isRnd) console.log('RND_DELIVERY', JSON.stringify({requestId:b.requestId, ownerMailId:ownerMail && ownerMail.id, confirmationMailId:confirmationMail && confirmationMail.id, confirmationSent, capiStatus, testMode}));
  return res.status(200).json({ ok: true, confirmationSent, ...(isRnd ? {requestId:b.requestId,testMode} : {}) });
};
