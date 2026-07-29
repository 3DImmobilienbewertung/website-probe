/* 3D Immobilienbewertung — Erklärfilm scenes.
   Loaded via x-import after animations-v2.jsx + tweaks-stub.jsx.
   Brand: Navy #003050, White/cool-grey, Gold #F2B01E accent. */

const E = window.Easing;
const clamp = window.clamp;

const C = {
  bg0: '#ffffff', bg1: '#e9eff5', bg2: '#dbe4ee',
  navy: '#003050', navyMid: '#1b4a6b', ink: '#0d2438',
  slate: '#5b7089', slateSoft: '#8496a8',
  line: '#c9d6e2', lineSoft: '#dde5ee',
  gold: '#f2b01e', goldDeep: '#d99a08', goldSoft: 'rgba(242,176,30,0.16)',
  white: '#ffffff',
};
const F = "'Manrope', system-ui, sans-serif";
const M = "'JetBrains Mono', ui-monospace, monospace";

// ── motion helpers (only three) ───────────────────────────────────────────
const seg = (t, a, b, ease) => {
  if (b <= a) return t >= b ? 1 : 0;
  const k = clamp((t - a) / (b - a), 0, 1);
  return (ease || E.easeOutCubic)(k);
};
const lerp = (a, b, t) => a + (b - a) * t;
// scene-level outro so every scene's LAST frame is background-only → seamless cut
const outro = (localTime, dur) => 1 - seg(localTime, dur - 0.55, dur - 0.05, E.easeInCubic);

const euro = (n) => Math.round(n).toLocaleString('de-DE');

// ── persistent chrome (identical in every scene) ──────────────────────────
function BlueprintBG() {
  return (
    <div style={{ position: 'absolute', inset: 0, background: C.white, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0,
        background: `radial-gradient(120% 120% at 50% -10%, ${C.bg0} 0%, ${C.bg1} 62%, ${C.bg2} 100%)` }} />
      {/* fine blueprint grid */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.55,
        backgroundImage:
          `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`,
        backgroundSize: '80px 80px', maskImage: 'radial-gradient(115% 100% at 50% 40%, #000 55%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(115% 100% at 50% 40%, #000 55%, transparent 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, opacity: 0.5,
        backgroundImage:
          `linear-gradient(${C.lineSoft} 1px, transparent 1px), linear-gradient(90deg, ${C.lineSoft} 1px, transparent 1px)`,
        backgroundSize: '16px 16px', maskImage: 'radial-gradient(90% 80% at 50% 45%, #000 30%, transparent 90%)',
        WebkitMaskImage: 'radial-gradient(90% 80% at 50% 45%, #000 30%, transparent 90%)' }} />
    </div>
  );
}
function Chrome() {
  return (
    <React.Fragment>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 96,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 72px', boxSizing: 'border-box' }}>
        <img src="assets/logo.png" alt="3D Immobilienbewertung" style={{ height: 40, display: 'block' }} />
        <div style={{ fontFamily: M, fontSize: 15, letterSpacing: '0.34em',
          color: C.slateSoft, textTransform: 'uppercase' }}>Region Hannover</div>
      </div>
      <div style={{ position: 'absolute', top: 96, left: 72, right: 72, height: 1, background: C.line }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 84,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 72px', boxSizing: 'border-box' }}>
        <div style={{ fontFamily: M, fontSize: 15, letterSpacing: '0.26em',
          color: C.navy, textTransform: 'uppercase' }}>3dimmobilienbewertung.de</div>
        <div style={{ fontFamily: M, fontSize: 15, letterSpacing: '0.26em',
          color: C.slateSoft, textTransform: 'uppercase' }}>Unabhängig · Nach ImmoWertV</div>
      </div>
      <div style={{ position: 'absolute', bottom: 84, left: 72, right: 72, height: 1, background: C.line }} />
    </React.Fragment>
  );
}
const CONTENT = { position: 'absolute', left: 0, right: 0, top: 96, bottom: 84, padding: '0 120px', boxSizing: 'border-box' };

function Eyebrow({ text, t, delay = 0.1 }) {
  const k = seg(t, delay, delay + 0.5);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, opacity: k,
      transform: `translateY(${(1 - k) * 12}px)` }}>
      <div style={{ width: lerp(0, 46, k), height: 2, background: C.gold }} />
      <span style={{ fontFamily: M, fontSize: 17, letterSpacing: '0.32em',
        textTransform: 'uppercase', color: C.navy }}>{text}</span>
    </div>
  );
}

// generic line-house wireframe. draw 0..1 reveals strokes in sequence.
function HouseWire({ size = 340, draw = 1, color = C.navy, stroke = 2.4 }) {
  const parts = [
    { d: 'M12 46 L50 14 L88 46', len: 1 },
    { d: 'M20 43 L20 90 L80 90 L80 43', len: 1 },
    { d: 'M44 90 L44 63 L57 63 L57 90', len: 1 },
    { d: 'M28 56 L38 56 L38 68 L28 68 Z', len: 1 },
    { d: 'M62 56 L72 56 L72 68 L62 68 Z', len: 1 },
  ];
  const n = parts.length;
  return (
    <svg width={size} height={size} viewBox="0 0 100 104" fill="none"
      style={{ display: 'block', overflow: 'visible' }}>
      {parts.map((p, i) => {
        const a = i / n, b = (i + 1) / n;
        const local = clamp((draw - a) / (b - a), 0, 1);
        const d = E.easeInOutCubic(local);
        return (
          <path key={i} d={p.d} stroke={color} strokeWidth={stroke}
            strokeLinecap="round" strokeLinejoin="round" pathLength="1"
            strokeDasharray="1" strokeDashoffset={1 - d} />
        );
      })}
    </svg>
  );
}

// ── SCENE 1 — Intro ────────────────────────────────────────────────────────
function SIntro({ localTime, dur }) {
  const t = localTime, o = outro(t, dur);
  const l1 = seg(t, 0.8, 1.5), l2 = seg(t, 1.15, 1.9);
  const house = seg(t, 0.4, 3.4);
  const uline = seg(t, 2.0, 2.9);
  return (
    <React.Fragment>
      <BlueprintBG />
      <Chrome />
      <div style={{ position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%,-52%)', opacity: house * 0.10 }}>
        <HouseWire size={720} draw={house} color={C.navy} stroke={1.3} />
      </div>
      <div style={{ ...CONTENT, opacity: o, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <Eyebrow text="Erklärfilm · Immobilienbewertung" t={t} delay={0.15} />
        <div style={{ height: 44 }} />
        <h1 style={{ margin: 0, fontFamily: F, fontWeight: 800, color: C.navy,
          fontSize: 108, lineHeight: 1.02, letterSpacing: '-0.02em' }}>
          <span style={{ display: 'block', opacity: l1, transform: `translateY(${(1 - l1) * 26}px)` }}>Wie funktioniert eine</span>
          <span style={{ display: 'inline-block', position: 'relative', opacity: l2,
            transform: `translateY(${(1 - l2) * 26}px)` }}>
            Immobilienbewertung?
            <span style={{ position: 'absolute', left: 0, bottom: -14, height: 6,
              width: `${uline * 100}%`, background: C.gold, borderRadius: 3 }} />
          </span>
        </h1>
        <div style={{ height: 40 }} />
        <p style={{ margin: 0, fontFamily: F, fontWeight: 500, color: C.slate, fontSize: 30,
          maxWidth: 900, lineHeight: 1.4, opacity: seg(t, 2.6, 3.4),
          transform: `translateY(${(1 - seg(t, 2.6, 3.4)) * 16}px)` }}>
          In sieben Schritten vom Objekt zum belastbaren Wertgutachten.
        </p>
      </div>
    </React.Fragment>
  );
}

// ── SCENE 2 — Was ist eine Bewertung ────────────────────────────────────────
function SWasIst({ localTime, dur }) {
  const t = localTime, o = outro(t, dur);
  const house = seg(t, 0.7, 3.2);
  const arrow = seg(t, 3.0, 3.8);
  const val = seg(t, 3.6, 4.6, E.easeOutBack);
  return (
    <React.Fragment>
      <BlueprintBG />
      <Chrome />
      <div style={{ ...CONTENT, opacity: o, display: 'grid',
        gridTemplateColumns: '1fr 1fr', alignItems: 'center', gap: 60 }}>
        <div>
          <Eyebrow text="01 · Was ist eine Bewertung" t={t} />
          <h2 style={{ margin: '30px 0 0', fontFamily: F, fontWeight: 800, color: C.navy,
            fontSize: 68, lineHeight: 1.06, letterSpacing: '-0.02em',
            opacity: seg(t, 0.5, 1.2), transform: `translateY(${(1 - seg(t, 0.5, 1.2)) * 20}px)` }}>
            Der reale Marktwert<br />Ihrer Immobilie.
          </h2>
          <p style={{ margin: '30px 0 0', fontFamily: F, fontWeight: 500, color: C.slate,
            fontSize: 27, lineHeight: 1.5, maxWidth: 560,
            opacity: seg(t, 1.4, 2.2), transform: `translateY(${(1 - seg(t, 1.4, 2.2)) * 16}px)` }}>
            Eine Bewertung ermittelt objektiv, was Ihre Immobilie am Markt tatsächlich wert ist — unabhängig von Verkaufsinteressen.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
          <div style={{ position: 'relative' }}>
            <HouseWire size={300} draw={house} color={C.navy} stroke={2.4} />
          </div>
          <div style={{ fontFamily: F, fontWeight: 800, fontSize: 72, color: C.navy,
            opacity: arrow, transform: `translateX(${(1 - arrow) * -20}px)` }}>→</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
            opacity: val, transform: `scale(${lerp(0.7, 1, val)})` }}>
            <div style={{ fontFamily: M, fontSize: 16, letterSpacing: '0.26em', color: C.slateSoft,
              textTransform: 'uppercase', marginBottom: 8 }}>Marktwert</div>
            <div style={{ fontFamily: F, fontWeight: 800, fontSize: 96, color: C.gold,
              lineHeight: 1 }}>€</div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

// ── SCENE 3 — Daten ──────────────────────────────────────────────────────────
function DataIcon({ kind, c = C.navy }) {
  const s = { width: 44, height: 44 };
  const common = { stroke: c, strokeWidth: 2.2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    lage: <React.Fragment><path d="M22 4C14 4 8 10 8 18c0 9 14 22 14 22s14-13 14-22c0-8-6-14-14-14Z" {...common} /><circle cx="22" cy="18" r="5" {...common} /></React.Fragment>,
    flaeche: <React.Fragment><rect x="7" y="9" width="30" height="26" {...common} /><path d="M7 18h30M16 9v26" {...common} /></React.Fragment>,
    baujahr: <React.Fragment><circle cx="22" cy="22" r="15" {...common} /><path d="M22 13v9l6 4" {...common} /></React.Fragment>,
    zustand: <React.Fragment><path d="M22 6l4.6 9.3 10.3 1.5-7.4 7.2 1.7 10.2L22 29.4 12.8 34l1.7-10.2-7.4-7.2 10.3-1.5L22 6Z" {...common} /></React.Fragment>,
    ausstattung: <React.Fragment><path d="M9 35V17l13-9 13 9v18" {...common} /><rect x="17" y="24" width="10" height="11" {...common} /></React.Fragment>,
  };
  return <svg viewBox="0 0 44 44" style={s}>{paths[kind]}</svg>;
}
function SDaten({ localTime, dur }) {
  const t = localTime, o = outro(t, dur);
  const items = [
    { n: '01', k: 'lage', label: 'Lage & Adresse', sub: 'Makro- und Mikrolage' },
    { n: '02', k: 'flaeche', label: 'Wohn- & Grundfläche', sub: 'Grundstück & Räume' },
    { n: '03', k: 'baujahr', label: 'Baujahr', sub: 'Modernisierungen' },
    { n: '04', k: 'zustand', label: 'Zustand', sub: 'Substanz & Instandhaltung' },
    { n: '05', k: 'ausstattung', label: 'Ausstattung', sub: 'Qualität & Standard' },
  ];
  return (
    <React.Fragment>
      <BlueprintBG />
      <Chrome />
      <div style={{ ...CONTENT, opacity: o, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Eyebrow text="02 · Welche Daten werden benötigt" t={t} />
        <h2 style={{ margin: '26px 0 40px', fontFamily: F, fontWeight: 800, color: C.navy,
          fontSize: 60, lineHeight: 1.05, letterSpacing: '-0.02em',
          opacity: seg(t, 0.5, 1.2), transform: `translateY(${(1 - seg(t, 0.5, 1.2)) * 18}px)` }}>
          Wenige Angaben genügen zum Start.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 24 }}>
          {items.map((it, i) => {
            const k = seg(t, 1.3 + i * 0.28, 1.3 + i * 0.28 + 0.6, E.easeOutBack);
            return (
              <div key={i} style={{ background: C.white, border: `1px solid ${C.line}`,
                borderRadius: 18, padding: '30px 26px', boxShadow: '0 18px 40px rgba(0,48,80,0.07)',
                opacity: clamp(k, 0, 1), transform: `translateY(${(1 - k) * 30}px)` }}>
                <div style={{ fontFamily: M, fontSize: 15, letterSpacing: '0.2em', color: C.gold,
                  marginBottom: 22 }}>{it.n}</div>
                <DataIcon kind={it.k} />
                <div style={{ fontFamily: F, fontWeight: 700, fontSize: 25, color: C.navy,
                  marginTop: 22, lineHeight: 1.15 }}>{it.label}</div>
                <div style={{ fontFamily: F, fontWeight: 500, fontSize: 17, color: C.slate,
                  marginTop: 8, lineHeight: 1.3 }}>{it.sub}</div>
              </div>
            );
          })}
        </div>
      </div>
    </React.Fragment>
  );
}

// ── SCENE 4 — Analyse ─────────────────────────────────────────────────────────
function SAnalyse({ localTime, dur }) {
  const t = localTime, o = outro(t, dur);
  const pin = seg(t, 1.7, 2.5, E.easeOutBack);
  const gauge = seg(t, 2.3, 3.6);
  const chart = seg(t, 3.0, 5.6);
  // market line points
  const pts = [[0, 74], [16, 68], [33, 70], [50, 54], [66, 48], [83, 30], [100, 16]];
  const W = 300, H = 150;
  const toXY = (p) => [12 + (p[0] / 100) * (W - 24), 12 + (p[1] / 100) * (H - 24)];
  const path = pts.map((p, i) => (i ? 'L' : 'M') + toXY(p).join(' ')).join(' ');
  const end = toXY(pts[pts.length - 1]);
  return (
    <React.Fragment>
      <BlueprintBG />
      <Chrome />
      <div style={{ ...CONTENT, opacity: o, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Eyebrow text="03 · Analyse" t={t} />
        <h2 style={{ margin: '26px 0 44px', fontFamily: F, fontWeight: 800, color: C.navy,
          fontSize: 60, lineHeight: 1.05, letterSpacing: '-0.02em',
          opacity: seg(t, 0.5, 1.2), transform: `translateY(${(1 - seg(t, 0.5, 1.2)) * 18}px)` }}>
          Lage, Zustand und Markt im Blick.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 32 }}>
          {/* Lage — mini map with pin */}
          <div style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 20,
            padding: 30, boxShadow: '0 18px 40px rgba(0,48,80,0.07)',
            opacity: seg(t, 1.1, 1.7), transform: `translateY(${(1 - seg(t, 1.1, 1.7)) * 22}px)` }}>
            <div style={{ fontFamily: M, fontSize: 15, letterSpacing: '0.22em', color: C.slateSoft, textTransform: 'uppercase' }}>Lage</div>
            <div style={{ position: 'relative', height: 200, marginTop: 20, borderRadius: 14,
              overflow: 'hidden', background: C.bg1, border: `1px solid ${C.lineSoft}` }}>
              <div style={{ position: 'absolute', inset: 0, opacity: 0.7, backgroundImage:
                `linear-gradient(${C.line} 1px,transparent 1px),linear-gradient(90deg,${C.line} 1px,transparent 1px)`,
                backgroundSize: '34px 34px' }} />
              <div style={{ position: 'absolute', top: 30, left: -20, width: 260, height: 26,
                background: C.lineSoft, transform: 'rotate(-24deg)' }} />
              <div style={{ position: 'absolute', top: 120, left: -20, width: 300, height: 20,
                background: C.lineSoft, transform: 'rotate(8deg)' }} />
              <div style={{ position: 'absolute', left: '52%', top: '46%',
                transform: `translate(-50%,-100%) translateY(${(1 - pin) * -60}px) scale(${lerp(0.6, 1, pin)})`,
                opacity: pin }}>
                <svg width="44" height="56" viewBox="0 0 44 56" fill="none">
                  <path d="M22 2C11 2 3 10 3 21c0 13 19 33 19 33s19-20 19-33C41 10 33 2 22 2Z"
                    fill={C.gold} stroke={C.goldDeep} strokeWidth="1.5" />
                  <circle cx="22" cy="20" r="7" fill={C.white} />
                </svg>
              </div>
            </div>
          </div>
          {/* Zustand — gauge */}
          <div style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 20,
            padding: 30, boxShadow: '0 18px 40px rgba(0,48,80,0.07)',
            opacity: seg(t, 1.3, 1.9), transform: `translateY(${(1 - seg(t, 1.3, 1.9)) * 22}px)` }}>
            <div style={{ fontFamily: M, fontSize: 15, letterSpacing: '0.22em', color: C.slateSoft, textTransform: 'uppercase' }}>Zustand</div>
            <div style={{ height: 200, marginTop: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {['Substanz', 'Modernisierung', 'Instandhaltung'].map((lab, i) => {
                const fill = clamp((gauge - i * 0.12) * [0.86, 0.72, 0.9][i], 0, 1);
                return (
                  <div key={i} style={{ marginBottom: 26 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: F,
                      fontWeight: 600, fontSize: 18, color: C.navy, marginBottom: 10 }}>
                      <span>{lab}</span>
                    </div>
                    <div style={{ height: 10, borderRadius: 6, background: C.bg2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${fill * 100}%`, background: C.navy, borderRadius: 6 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Markt — rising chart */}
          <div style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 20,
            padding: 30, boxShadow: '0 18px 40px rgba(0,48,80,0.07)',
            opacity: seg(t, 1.5, 2.1), transform: `translateY(${(1 - seg(t, 1.5, 2.1)) * 22}px)` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: M, fontSize: 15, letterSpacing: '0.22em', color: C.slateSoft, textTransform: 'uppercase' }}>Markt</span>
              <span style={{ fontFamily: F, fontWeight: 800, fontSize: 26, color: C.gold, opacity: seg(t, 4.6, 5.4) }}>
                +{Math.round(seg(t, 3.2, 5.4) * 6.4)}%
              </span>
            </div>
            <svg width="100%" height="200" viewBox={`0 0 ${W} ${H}`} style={{ marginTop: 14 }}>
              {[0.25, 0.5, 0.75].map((g, i) => (
                <line key={i} x1="12" x2={W - 12} y1={12 + g * (H - 24)} y2={12 + g * (H - 24)}
                  stroke={C.lineSoft} strokeWidth="1" />
              ))}
              <path d={path} fill="none" stroke={C.navy} strokeWidth="3" strokeLinecap="round"
                strokeLinejoin="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - chart} />
              <circle cx={end[0]} cy={end[1]} r="6" fill={C.gold} opacity={seg(t, 5.1, 5.5)} />
            </svg>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

// ── SCENE 5 — Verfahren ────────────────────────────────────────────────────────
function VerfIcon({ kind }) {
  const common = { stroke: C.navy, strokeWidth: 2.2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const p = {
    vergleich: <React.Fragment><path d="M8 34V16l10-7 10 7" {...common} /><path d="M26 34V20l10-7 10 7v14" {...common} /><path d="M4 40h44" {...common} /></React.Fragment>,
    ertrag: <React.Fragment><path d="M26 6v40M18 15c0-4 4-6 8-6s8 2 8 6-4 6-8 6-8 2-8 6 4 6 8 6 8-2 8-6" {...common} /></React.Fragment>,
    sach: <React.Fragment><rect x="8" y="18" width="36" height="24" {...common} /><path d="M26 8l14 10M26 8L12 18" {...common} /><rect x="22" y="30" width="8" height="12" {...common} /></React.Fragment>,
  };
  return <svg width="52" height="52" viewBox="0 0 52 52">{p[kind]}</svg>;
}
function SVerfahren({ localTime, dur }) {
  const t = localTime, o = outro(t, dur);
  const cols = [
    { r: 'I', k: 'vergleich', name: 'Vergleichswert', d: 'Preise vergleichbarer, kürzlich verkaufter Objekte.', use: 'Eigentumswohnungen · Einfamilienhäuser' },
    { r: 'II', k: 'ertrag', name: 'Ertragswert', d: 'Wert aus den nachhaltig erzielbaren Mieterträgen.', use: 'Vermietete & Renditeobjekte' },
    { r: 'III', k: 'sach', name: 'Sachwert', d: 'Bodenwert plus Herstellungskosten des Gebäudes.', use: 'Selbstgenutzte Spezialimmobilien' },
  ];
  return (
    <React.Fragment>
      <BlueprintBG />
      <Chrome />
      <div style={{ ...CONTENT, opacity: o, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Eyebrow text="04 · Bewertungsverfahren" t={t} />
        <h2 style={{ margin: '26px 0 44px', fontFamily: F, fontWeight: 800, color: C.navy,
          fontSize: 60, lineHeight: 1.05, letterSpacing: '-0.02em',
          opacity: seg(t, 0.5, 1.2), transform: `translateY(${(1 - seg(t, 0.5, 1.2)) * 18}px)` }}>
          Drei anerkannte Verfahren nach ImmoWertV.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 32 }}>
          {cols.map((c, i) => {
            const k = seg(t, 1.3 + i * 0.5, 1.3 + i * 0.5 + 0.7, E.easeOutCubic);
            return (
              <div key={i} style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 20,
                padding: '38px 34px', boxShadow: '0 18px 40px rgba(0,48,80,0.07)', position: 'relative',
                opacity: k, transform: `translateY(${(1 - k) * 34}px)`, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 5, background: C.gold }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <VerfIcon kind={c.k} />
                  <span style={{ fontFamily: F, fontWeight: 800, fontSize: 40, color: C.lineSoft }}>{c.r}</span>
                </div>
                <div style={{ fontFamily: F, fontWeight: 800, fontSize: 32, color: C.navy, marginTop: 26 }}>{c.name}</div>
                <p style={{ fontFamily: F, fontWeight: 500, fontSize: 20, color: C.slate, lineHeight: 1.45, margin: '14px 0 22px' }}>{c.d}</p>
                <div style={{ paddingTop: 20, borderTop: `1px solid ${C.lineSoft}`, fontFamily: M,
                  fontSize: 14, letterSpacing: '0.12em', color: C.navyMid, textTransform: 'uppercase', lineHeight: 1.5 }}>{c.use}</div>
              </div>
            );
          })}
        </div>
      </div>
    </React.Fragment>
  );
}

// ── SCENE 6 — Zusammenführung ────────────────────────────────────────────────
function SZusammen({ localTime, dur }) {
  const t = localTime, o = outro(t, dur);
  const streams = ['Objektdaten', 'Lage & Markt', 'Verfahren'];
  const count = seg(t, 2.6, 5.2, E.easeOutCubic);
  const value = Math.round(lerp(0, 485000, count) / 1000) * 1000;
  const nodeK = seg(t, 2.2, 2.9, E.easeOutBack);
  return (
    <React.Fragment>
      <BlueprintBG />
      <Chrome />
      <div style={{ ...CONTENT, opacity: o, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ alignSelf: 'flex-start' }}>
          <Eyebrow text="05 · Zusammenführung" t={t} />
          <h2 style={{ margin: '26px 0 0', fontFamily: F, fontWeight: 800, color: C.navy,
            fontSize: 56, lineHeight: 1.05, letterSpacing: '-0.02em',
            opacity: seg(t, 0.5, 1.2), transform: `translateY(${(1 - seg(t, 0.5, 1.2)) * 18}px)` }}>
            Alle Daten fließen zu einem Wert zusammen.
          </h2>
        </div>
        <div style={{ position: 'relative', width: '100%', height: 330, marginTop: 26,
          display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
            {streams.map((s, i) => {
              const k = seg(t, 0.9 + i * 0.25, 0.9 + i * 0.25 + 0.6);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 20, opacity: k,
                  transform: `translateX(${(1 - k) * -30}px)` }}>
                  <div style={{ fontFamily: F, fontWeight: 700, fontSize: 24, color: C.navy,
                    width: 240, textAlign: 'right' }}>{s}</div>
                  <div style={{ height: 3, width: lerp(60, 200, seg(t, 1.6 + i * 0.2, 2.4 + i * 0.2)),
                    background: `linear-gradient(90deg, ${C.line}, ${C.gold})` }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
            marginLeft: 30, opacity: nodeK, transform: `scale(${lerp(0.7, 1, nodeK)})` }}>
            <div style={{ fontFamily: M, fontSize: 16, letterSpacing: '0.24em', color: C.slateSoft,
              textTransform: 'uppercase', marginBottom: 14 }}>Verkehrswert</div>
            <div style={{ fontFamily: F, fontWeight: 800, fontSize: 120, color: C.navy, lineHeight: 1,
              letterSpacing: '-0.02em' }}>
              {euro(value)} <span style={{ color: C.gold }}>€</span>
            </div>
            <div style={{ fontFamily: F, fontWeight: 500, fontSize: 22, color: C.slate, marginTop: 14,
              opacity: seg(t, 5.0, 5.8) }}>Nachvollziehbar für jeden Euro.</div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

// ── SCENE 7 — Gutachten ────────────────────────────────────────────────────────
function SGutachten({ localTime, dur }) {
  const t = localTime, o = outro(t, dur);
  const doc = seg(t, 0.9, 1.8, E.easeOutCubic);
  const seal = seg(t, 3.1, 3.7, E.easeOutBack);
  const rows = [0, 1, 2, 3];
  const tags = ['Gericht', 'Finanzamt', 'Banken', 'Erbschaft'];
  return (
    <React.Fragment>
      <BlueprintBG />
      <Chrome />
      <div style={{ ...CONTENT, opacity: o, display: 'grid', gridTemplateColumns: '1fr 1fr',
        alignItems: 'center', gap: 70 }}>
        <div>
          <Eyebrow text="06 · Das Gutachten" t={t} />
          <h2 style={{ margin: '30px 0 0', fontFamily: F, fontWeight: 800, color: C.navy,
            fontSize: 64, lineHeight: 1.05, letterSpacing: '-0.02em',
            opacity: seg(t, 0.5, 1.2), transform: `translateY(${(1 - seg(t, 0.5, 1.2)) * 18}px)` }}>
            Ein belastbares Wertgutachten.
          </h2>
          <p style={{ margin: '28px 0 34px', fontFamily: F, fontWeight: 500, color: C.slate,
            fontSize: 26, lineHeight: 1.5, maxWidth: 540,
            opacity: seg(t, 1.5, 2.3), transform: `translateY(${(1 - seg(t, 1.5, 2.3)) * 16}px)` }}>
            Alle Ergebnisse werden in einem transparenten Dokument dokumentiert — geeignet für Behörden und Institutionen.
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {tags.map((tg, i) => {
              const k = seg(t, 4.0 + i * 0.18, 4.0 + i * 0.18 + 0.5);
              return (
                <span key={i} style={{ fontFamily: M, fontSize: 16, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: C.navy, border: `1px solid ${C.line}`,
                  background: C.white, borderRadius: 999, padding: '12px 22px',
                  opacity: k, transform: `translateY(${(1 - k) * 14}px)` }}>{tg}</span>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: 420, height: 540, background: C.white,
            border: `1px solid ${C.line}`, borderRadius: 12, boxShadow: '0 40px 80px rgba(0,48,80,0.14)',
            opacity: doc, transform: `translateY(${(1 - doc) * 40}px)`, padding: 44, boxSizing: 'border-box' }}>
            <img src="assets/logo.png" alt="" style={{ height: 30, opacity: seg(t, 1.6, 2.2) }} />
            <div style={{ fontFamily: F, fontWeight: 800, fontSize: 27, color: C.navy, marginTop: 30,
              opacity: seg(t, 1.9, 2.5) }}>Verkehrswertgutachten</div>
            <div style={{ fontFamily: M, fontSize: 14, letterSpacing: '0.16em', color: C.slateSoft,
              textTransform: 'uppercase', marginTop: 8, opacity: seg(t, 2.0, 2.6) }}>§ 194 BauGB · ImmoWertV</div>
            <div style={{ marginTop: 34 }}>
              {rows.map((r, i) => {
                const k = seg(t, 2.4 + i * 0.22, 2.4 + i * 0.22 + 0.5);
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
                    padding: '16px 0', borderBottom: `1px solid ${C.lineSoft}`, opacity: k,
                    transform: `translateX(${(1 - k) * 14}px)` }}>
                    <div style={{ height: 10, width: [130, 160, 120, 150][i], background: C.bg2, borderRadius: 5 }} />
                    <div style={{ height: 10, width: [64, 48, 72, 56][i], background: C.line, borderRadius: 5 }} />
                  </div>
                );
              })}
            </div>
            <div style={{ position: 'absolute', right: 40, bottom: 44, width: 118, height: 118,
              borderRadius: '50%', border: `3px solid ${C.gold}`, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', color: C.goldDeep, background: C.goldSoft,
              opacity: seal, transform: `scale(${lerp(1.6, 1, seal)}) rotate(${lerp(-14, -8, seal)}deg)` }}>
              <span style={{ fontFamily: M, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Geprüft</span>
              <span style={{ fontFamily: F, fontWeight: 800, fontSize: 22, marginTop: 2 }}>3D</span>
              <span style={{ fontFamily: M, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 2 }}>Sachverständig</span>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

// ── SCENE 8 — CTA ────────────────────────────────────────────────────────────
function SCTA({ localTime, dur }) {
  const t = localTime, o = outro(t, dur);
  const logoK = seg(t, 0.4, 1.4, E.easeOutCubic);
  const sweep = seg(t, 0.8, 2.0);
  const head = seg(t, 1.6, 2.4);
  const btn = seg(t, 2.2, 2.9, E.easeOutBack);
  const url = seg(t, 2.7, 3.4);
  return (
    <React.Fragment>
      <BlueprintBG />
      <Chrome />
      <div style={{ ...CONTENT, opacity: o, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ position: 'relative', opacity: logoK, transform: `translateY(${(1 - logoK) * 20}px) scale(${lerp(0.94, 1, logoK)})` }}>
          <img src="assets/logo.png" alt="3D Immobilienbewertung" style={{ height: 128, display: 'block' }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, width: 120,
            left: `${lerp(-20, 120, sweep)}%`, transform: 'skewX(-18deg)',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)',
            mixBlendMode: 'overlay', opacity: sweep > 0 && sweep < 1 ? 1 : 0 }} />
        </div>
        <h2 style={{ margin: '56px 0 0', fontFamily: F, fontWeight: 800, color: C.navy,
          fontSize: 82, lineHeight: 1.04, letterSpacing: '-0.02em',
          opacity: head, transform: `translateY(${(1 - head) * 22}px)` }}>
          Jetzt Immobilienbewertung<br />anfragen.
        </h2>
        <div style={{ marginTop: 46, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30 }}>
          <div style={{ fontFamily: F, fontWeight: 700, fontSize: 26, color: C.navy,
            background: C.gold, borderRadius: 999, padding: '22px 52px',
            boxShadow: '0 20px 44px rgba(242,176,30,0.4)',
            opacity: btn, transform: `scale(${lerp(0.8, 1, btn)})` }}>
            Kostenlose Ersteinschätzung sichern
          </div>
          <div style={{ fontFamily: M, fontSize: 24, letterSpacing: '0.16em', color: C.navyMid,
            textTransform: 'uppercase', opacity: url, transform: `translateY(${(1 - url) * 12}px)` }}>
            3dimmobilienbewertung.de
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────
const SCENE_MAP = {
  Intro: SIntro, WasIst: SWasIst, Daten: SDaten, Analyse: SAnalyse,
  Verfahren: SVerfahren, Zusammen: SZusammen, Gutachten: SGutachten, CTA: SCTA,
};

function Erklaervideo() {
  return (
    <window.SceneStage width={1920} height={1080} scenes={window.OM_SCENES}
      playback={window.OM_PLAYBACK} transition="overlap" bg="#ffffff">
      {SCENE_MAP}
    </window.SceneStage>
  );
}
window.Erklaervideo = Erklaervideo;
