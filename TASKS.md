# Taskboard — 3dimmobilienbewertung.de

Gemeinsames Board von **CC** (Claude Code) und **GPT** (ChatGPT).
Regeln in `BRIEFING-CHATGPT.md`. Kurzfassung: Status pflegen, Eigentümer der
Folgeaufgabe setzen, fremde Einträge nicht überschreiben.

Letzte Änderung: 2026-10-21, CC · Stand `9c1509f` · **live auf der Domain**

---

## Für GPT — morgen

### T-13 · Abnahme des Redesigns
**Eigentümer: GPT · Status: offen**

Der Inhaber möchte, dass du meine Arbeit prüfst. Basis ist `main` ab Commit
`98c0eca` bis `9c1509f`. Vier Commits:

| Commit | Inhalt |
|---|---|
| `98c0eca` | Redesign-Layer, linksbündig, Bewertungszahl 31→76 |
| `2ccd5be` | Dieses Board und das Briefing |
| `9c1509f` | Kinematischer Hero auf der Startseite |

**Prüfe bitte gezielt diese Punkte — dort bin ich mir am wenigsten sicher:**

1. **Hero-Zoom.** Ich skaliere das Hero-Foto per CSS auf `scale(1.55)` mit
   `transform-origin: center 46%`. Das ist nötig, weil das Motiv ein helles
   Büro ist und ohne Zoom unter dem Verlauf zu grauem Matsch wird. Prüfe auf
   Geräten zwischen 768px und 1024px, ob der Ausschnitt dort noch sinnvoll
   sitzt. Ich habe nur 375px und 1280px gesehen.
2. **Aufgelöstes `figure`/`figcaption` im Hero.** Ich habe es in `hero-media`
   plus `hero-footer` zerlegt. Alt-Text und `fetchpriority` sind am `img`
   geblieben. Prüfe, ob das aus deiner Sicht semantisch vertretbar ist.
3. **Bewertungszahl 76.** Stammt aus dem Screenshot des Inhabers im
   Abnahmeverfahren. Google Maps konnte ich nicht gegenprüfen, dort steht
   eine Consent-Wall. Wenn du an die echte Zahl kommst: gegenprüfen.
4. **Kontrast auf dem Hero.** Weiße Schrift über Foto plus Verlauf. Miss bitte
   nach, ob WCAG AA (4,5:1) an den Textstellen eingehalten ist. Mein eigener
   Kontrasttest kann Text über Bildern nicht bewerten — das ist in einer
   früheren Runde schon einmal zu 19 Falschbefunden geführt.

Melde zurück als BLOCKIEREND / WICHTIG / SPÄTER mit Datei:Zeile.
→ danach T-14 an CC

### T-14 · Hero-Prinzip auf Unterseiten ausrollen
**Eigentümer: GPT · Status: offen, erst nach T-13**
Der kinematische Hero liegt bisher nur auf `index.html`. Ortsseiten und
Geldseite sollen folgen. Vorhandene Fotos nutzen, keine neuen. Die Klassen
`hero-cine`, `hero-media`, `hero-footer` und das CSS in
`assets/redesign-20261021.css` sind vorbereitet und wiederverwendbar.
Textinhalt muss vorher/nachher identisch bleiben — maschinell vergleichen.

### T-09 · Mobil 375px über alle Seiten
**Eigentümer: GPT · Status: offen**
Startseite und Geldseite habe ich geprüft. Die übrigen 51 fehlen.
Eingabefelder ≥16px, sonst zoomt iOS beim Fokus.

---

## Beim Inhaber

### T-11 · Kundenstimme „zertifizierter Gutachter"
**Status: wartet auf Entscheidung**
Zitat auf der Startseite trägt die Aussage „zertifiziert" an den Leser. Die
Inhaber dürfen das nicht führen. Weder eigenmächtig ändern noch stehen lassen.

### T-12 · Meta-Variablen in Vercel
**Status: offen**
`META_PIXEL_ID` = `2126043741457881`, `META_CAPI_TOKEN` aus dem Events
Manager, danach Redeploy. CC kann es nicht prüfen — der Vercel-Connector
bekommt 403 auf Umgebungsvariablen.

---

## Fertig

| Nr. | Was | Wer | Commit |
|---|---|---|---|
| T-01 | Hanken Grotesk statt Bricolage, Weight 450/500. Bricolage entfällt: 40,4 KB weniger | CC | `fb9cb0c` |
| T-02 | Portraits: gleicher Ausschnitt, gleiche Augenlinie | CC | `fb9cb0c` |
| T-03 | Schwarmstedt 5→19, Laatzen 4→18 interne Links. **Nicht entfernen.** | CC | `eec2128` |
| T-04 | 22 Fotos farbkorrigiert, 78 KB kleiner | CC | `85e1e14` |
| T-05 | Bewertungssterne gefüllt statt Umriss | CC | `93e6de8` |
| T-06 | Redesign-Layer, linksbündig, Rhythmus, randlose Flächen, Gold als Akzent; Bewertungszahl 76 | CC | `98c0eca` |
| T-07 | Inline-Zentrierungen aus `index.html` | CC | `98c0eca` |
| T-13a | Kinematischer Hero auf der Startseite | CC | `9c1509f` |

**Ladegewicht gesamt:** rund 118 KB leichter als am Morgen des 21.10. — eine
Schriftdatei weniger plus kleinere Bilder, trotz besserer Darstellung.
