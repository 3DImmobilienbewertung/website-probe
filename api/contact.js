module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, phone, objekt, anlass, message } = req.body || {};

  if (!name || !email) {
    return res.status(400).json({ error: 'Name und E-Mail sind Pflichtfelder.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Konfigurationsfehler – API Key fehlt.' });
  }

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;padding:32px;background:#f9fbff">
      <div style="background:#16365C;padding:24px 32px;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;margin:0;font-size:22px">Neue Anfrage</h1>
        <p style="color:#bcd6ff;margin:6px 0 0;font-size:14px">3D Immobilienbewertung · Website</p>
      </div>
      <div style="background:#fff;padding:32px;border:1px solid #e0e8f4;border-top:none;border-radius:0 0 12px 12px">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:10px 0;color:#5c7088;font-size:14px;width:130px;border-bottom:1px solid #f0f4f8">Name</td><td style="padding:10px 0;font-weight:600;border-bottom:1px solid #f0f4f8">${name}</td></tr>
          <tr><td style="padding:10px 0;color:#5c7088;font-size:14px;border-bottom:1px solid #f0f4f8">E-Mail</td><td style="padding:10px 0;border-bottom:1px solid #f0f4f8"><a href="mailto:${email}" style="color:#16365C">${email}</a></td></tr>
          <tr><td style="padding:10px 0;color:#5c7088;font-size:14px;border-bottom:1px solid #f0f4f8">Telefon</td><td style="padding:10px 0;border-bottom:1px solid #f0f4f8">${phone || '—'}</td></tr>
          <tr><td style="padding:10px 0;color:#5c7088;font-size:14px;border-bottom:1px solid #f0f4f8">Objektart</td><td style="padding:10px 0;border-bottom:1px solid #f0f4f8">${objekt || '—'}</td></tr>
          <tr><td style="padding:10px 0;color:#5c7088;font-size:14px;border-bottom:1px solid #f0f4f8">Anlass</td><td style="padding:10px 0;border-bottom:1px solid #f0f4f8">${anlass || '—'}</td></tr>
          <tr><td style="padding:10px 0;color:#5c7088;font-size:14px;vertical-align:top">Nachricht</td><td style="padding:10px 0">${(message || '—').replace(/\n/g, '<br>')}</td></tr>
        </table>
        <div style="margin-top:28px;padding:18px 20px;background:#f2f6fb;border-radius:8px">
          <p style="margin:0;font-size:13px;color:#5c7088">Schnellantwort: <a href="mailto:${email}?subject=Re: Ihre Anfrage zur Immobilienbewertung" style="color:#16365C;font-weight:600">An ${email} antworten</a></p>
        </div>
      </div>
      <p style="color:#b0bec5;font-size:11px;margin-top:16px;text-align:center">Gesendet über www.3dimmobilienbewertung.de</p>
    </div>
  `;

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Anfrage Website <onboarding@resend.dev>',
        to: ['info@3dimmobilienbewertung.de'],
        reply_to: email,
        subject: `Neue Anfrage: ${name} – ${objekt || 'Immobilienbewertung'}`,
        html
      })
    });

    if (resp.ok) {
      return res.status(200).json({ ok: true });
    } else {
      const err = await resp.text();
      console.error('Resend error:', err);
      return res.status(500).json({ error: 'E-Mail konnte nicht gesendet werden.' });
    }
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Interner Fehler.' });
  }
};
