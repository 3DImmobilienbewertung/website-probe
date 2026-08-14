// Kontakt-Endpunkt. Leitet Anfragen per Resend an das Postfach weiter und
// bestaetigt dem Interessenten den Eingang.
//
// Wichtig: Ein Lead darf niemals still verloren gehen. Schlaegt der Versand
// fehl, wird der komplette Datensatz in die Vercel-Logs geschrieben (dort
// unter "Runtime Logs" nachlesbar) UND ein 500 zurueckgegeben, damit das
// Formular im Browser den Fehler anzeigt statt faelschlich "Vielen Dank".

const EMPFAENGER = ['info@3dimmobilienbewertung.de', 'vito.donn85@gmail.com'];
const ABSENDER = '3D Immobilienbewertung <anfrage@3dimmobilienbewertung.de>';

function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function zeile(label, wert) {
  return `<tr><td style="padding:10px 0;color:#5c7088;font-size:14px;width:140px;border-bottom:1px solid #f0f4f8">${label}</td>` +
         `<td style="padding:10px 0;font-weight:600;color:#16365C;border-bottom:1px solid #f0f4f8">${wert || '&mdash;'}</td></tr>`;
}

async function sendeMail(apiKey, payload) {
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!resp.ok) throw new Error(`Resend ${resp.status}: ${await resp.text()}`);
  return resp.json();
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const b = req.body || {};
  const { name, email, phone, objekt, anlass, ort, zeitrahmen, message, website } = b;

  // Honeypot: echte Nutzer sehen das Feld nicht, Bots fuellen es aus.
  // Bots bekommen ein freundliches 200, damit sie nicht erneut probieren.
  if (website) return res.status(200).json({ ok: true });

  if (!name || !email) {
    return res.status(400).json({ error: 'Name und E-Mail sind Pflichtfelder.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim())) {
    return res.status(400).json({ error: 'Bitte eine gueltige E-Mail-Adresse angeben.' });
  }

  const eingang = new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });
  const quelle = req.headers.referer || '—';

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
    console.error('LEAD-NOTFALL (kein API-Key):', JSON.stringify(b));
    return res.status(500).json({ error: 'Konfigurationsfehler – API Key fehlt.' });
  }

  try {
    await sendeMail(apiKey, {
      from: ABSENDER,
      to: EMPFAENGER,
      reply_to: String(email).trim(),
      subject: `Neue Anfrage: ${name} – ${anlass || objekt || 'Immobilienbewertung'}`,
      html
    });
  } catch (err) {
    // Der Lead ist wertvoll: vollstaendig protokollieren, damit er aus den
    // Vercel-Runtime-Logs rekonstruiert werden kann.
    console.error('LEAD-NOTFALL – Versand fehlgeschlagen:', err.message, '| Daten:', JSON.stringify(b));
    return res.status(500).json({ error: 'E-Mail konnte nicht gesendet werden.' });
  }

  // Die Bestaetigung ist ein Bonus. Scheitert sie, ist der Lead trotzdem da –
  // deshalb darf sie die Antwort an den Browser nicht auf Fehler kippen.
  try {
    await sendeMail(apiKey, {
      from: ABSENDER,
      to: [String(email).trim()],
      reply_to: 'info@3dimmobilienbewertung.de',
      subject: 'Ihre Anfrage bei 3D Immobilienbewertung – wir melden uns in 24 Stunden',
      html: bestaetigung
    });
  } catch (err) {
    console.error('Bestaetigungsmail fehlgeschlagen (Lead ist zugestellt):', err.message);
  }

  return res.status(200).json({ ok: true });
};
