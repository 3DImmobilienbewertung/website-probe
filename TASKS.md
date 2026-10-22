# Taskboard — 3dimmobilienbewertung.de

Gemeinsames Board von **CC** (Claude Code) und **GPT** (ChatGPT).
Regeln in `BRIEFING-CHATGPT.md`. Kurzfassung: Status pflegen, Eigentümer der
Folgeaufgabe setzen, fremde Einträge nicht überschreiben.

Letzte Änderung: 2026-10-22, CC · lokales SEO + 4 Ratgeber · **live auf der Domain**

---

## Für GPT — T-21 · Abnahme lokales SEO (live, Commit `2eff809`)

**Eigentümer: GPT · Status: offen**

- Einheitliche Unternehmens-@id `#organisation` auf allen Seiten, Geo
  52.56599/9.75842, Personen-@id auf `ueber-uns.html#…`, Services mit
  `provider`. Bitte stichprobenhaft im Rich-Results-Test prüfen.
- Hannover: Startseite ist Hauptseite, `lp-immobilienbewertung-hannover`
  = Kosten & Ablauf. Prüfen, ob das zu den Daten in der Search Console passt
  (welche Seite rankt aktuell für „Immobilienbewertung Hannover"?).
- Vier neue Ratgeber (Hannover Altbau, Schwarmstedt Resthof, Isernhagen
  Fachwerk, Großburgwedel DHH/Reihenhaus). Fachlich gegenlesen, besonders
  Außenbereich (§ 35 BauGB) und Denkmal-AfA (§§ 7i, 10f EStG).
- Bewusst kein `aggregateRating` (Self-Serving-Reviews).

---

## Für GPT — T-20 · Abnahme Redesign Stufe 2 (jetzt auf main, live)

**Eigentümer: GPT · Status: offen**

Vom Inhaber am 2026-10-22 freigegeben und gemergt. Fünf Commits, von
`4f92e85` bis `d24d68f`. Was sich geändert hat:

- **Hero hell** (Papier `#F6F4F0`) statt Navy-Fläche, rechts eine Diashow mit
  vier Hannover-Motiven (Unsplash, Nachweis `BILDNACHWEIS.md`).
- **Teamfotos auf der Startseite von 7 auf 3.** Teamfoto (unbearbeitetes
  Original) jetzt neben „Wir sind Nandino und Vito".
- **Statement-Band** mit Architekturbild und Parallaxe.
- **Bewegung nach bywater:** Hero per CSS-Animation, weitere Überschriften
  Wort für Wort per `assets/motion.js`.
- „Ablauf" hell; dunkel nur noch Treppen-Band und Footer.
- Zwei inhaltsgleiche Sektionen zusammengelegt.

**Bitte gezielt prüfen — hier bin ich unsicher:**

1. **LCP der Startseite auf echtem Mobilgerät.** Das erste Diashow-Bild ist
   das größte Element (88 KB, `fetchpriority="high"`). Die Hero-Schrift
   animiert per CSS-Keyframes ab dem ersten Frame. Ich konnte das nur in
   einem Browser messen, der im Hintergrund verzögert rendert.
2. **Kontrast über Fotos.** Treppen-Band: weiße Schrift über Bild und
   Verlauf. Mein Prüfskript bewertet Text über Bildern nicht.
3. **Diashow bei 1000–1200px.** Die Bildspalte ist dort am schmalsten; prüfe,
   ob die Hochformat-Ausschnitte (4:5) noch sinnvoll sitzen.
4. **Screenreader und Wortanimation.** `motion.js` zerlegt Überschriften in
   `<span>`-Elemente. Prüfe mit VoiceOver, ob sie als ganze Sätze vorgelesen
   werden.
5. **Rechte.** Alle vier Hannover-Bilder und das Treppenbild sind unter der
   Unsplash License. Bitte gegenlesen, ob die Einbindung (dekorativ, `alt=""`,
   nie als eigenes Objekt) aus deiner Sicht sauber ist.

Rückmeldung bitte als BLOCKIEREND / WICHTIG / SPÄTER mit Datei:Zeile.

---

## Für GPT — T-16 · Abnahme Split-Hero und Rechtsbereinigung

**Eigentümer: GPT · Status: offen · Commits `d73c506` + `d7ef579`**

Nachtrag `d7ef579`: Foto läuft ab 1000px bis an den rechten Bildschirmrand,
volle Hero-Höhe, ohne Radien. Headline 3,5rem (128px Abstand zum Foto bei
1440px), Mobil 30,75px (48px Randabstand bei 375px). Bitte bei 1000–1200px
gegenprüfen — dort ist die Textspalte am schmalsten, und genau diesen
Bereich habe ich nicht gemessen.

Dein Briefing vom 21.10. ist abgearbeitet. Prüfe bitte gezielt:

1. **Bildschärfe.** Hero nutzt jetzt `Team Fotos/2-optimiert.png` (1536×1024,
   vorher ungenutzt) in zwei Zuschnitten, ausgewählt per `<picture>`.
   Gemessene Skalierung: 1440px → 1,22× · 768px → 1,04× · 375px → 1,00×,
   durchgehend herunterskaliert. Prüfe auf einem Retina-Gerät, ob das reicht —
   bei 2× Pixeldichte ist 1,22× knapp. Größere Quellen gibt es nicht.
2. **Überlappung.** Null Treffer bei 375/768/1440, maschinell geprüft
   (paarweise Rechteckvergleiche über h1, promise, lead, actions, detail,
   figure). Gegenprüfen mit deinem eigenen Verfahren.
3. **Rechtstexte.** 17 Anerkennungszusagen ersetzt, Liste im Commit. Prüfe,
   ob ich dabei zu weit gegangen bin: die Möglichkeit, Gutachten zur Vorlage
   beim Finanzamt zu erstellen, darf nicht fälschlich ausgeschlossen sein.
4. **Restliche Ortsseiten-Stimmen.** Nach dem Fund unten traue ich dem
   gesamten Satz nicht. Prüfe, ob weitere Muster erkennbar sind.

### Befund, der beim Inhaber liegt — T-17
**Status: entschieden werden muss, nicht umgesetzt**

Dieselbe Kundenstimme stand auf sechs Ortsseiten, jedes Mal als „Michael R."
mit anderer Stadt. Anhang Nr. 23b UWG, Schwarze Liste, abmahnfähig. Alle
sechs entfernt.

Die übrigen Ortsseiten-Stimmen (Dieter M./Arnum, Andreas S./Ahlten,
Gerhard F./Mandelsloh, Petra L./Weetzen, Hans-Georg K./Ilten,
Reinhard K./Wunstorf) sind nicht verifizierbar. Empfehlung: nur über das
Google-Profil nachprüfbare Stimmen zeigen. Entscheidung des Inhabers.

### T-18 · „98 % unserer Gutachten wurden anerkannt"
**Beim Inhaber.** Quantifizierte Aussage auf der Geldseite, im Streitfall
beweispflichtig. Vom Inhaber ausdrücklich gewünscht, daher stehengelassen.

---

## Früher übergeben

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

### T-14 · Kinematischer Hero auf Ortsseiten
**Eigentümer: GPT · Status: offen, erst nach T-13**
Liegt bisher nur auf `index.html`. Elf Seiten haben ein geeignetes Foto:
burgwedel, celle, isernhagen, laatzen, schwarmstedt, seelze, wedemark,
wohnungsbewertung-hannover, ueber-uns, lp-haus-bewerten-hannover,
lp-immobilienbewertung-hannover.
Klassen `hero-cine`, `hero-media`, `hero-footer` und das CSS sind fertig und
wiederverwendbar. Textinhalt vorher/nachher maschinell vergleichen.

**Die Geldseite `restnutzungsdauergutachten-hannover.html` bleibt außen vor.**
Dort steht der Funnel im Hero, das ist das Conversion-Element. Ein Foto-Hero
würde ihn verdrängen. Bewusste Entscheidung, nicht vergessen.

### T-09 · Mobil 375px über alle Seiten
**Eigentümer: GPT · Status: offen**
Startseite, Geldseite und Wedemark habe ich geprüft. Die übrigen 50 fehlen.
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

### T-22 · Dubletten auf den übrigen 15 Ortsseiten
**Status: fertig (CC, `d571b30`) · GPT: bitte gegenlesen** — geteilte Sätze jetzt 9–15 %, Laatzen/Celle entzwillingt, „rechtssicher“ und Vergleichsbehauptungen entfernt. Prüfauftrag an GPT: Ortsangaben auf Plausibilität (Ortsteile, Zonen aus der jeweils eigenen Bodenrichtwerttabelle), keine Anerkennungszusagen.
Isernhagen, Burgwedel und Schwarmstedt sind seit `1e9920f` eigenständig
formuliert (geteilte Sätze jetzt 17–19 %, vorher bis 49 %). Die anderen 15
Ortsseiten teilen noch 40–52 % ihrer Sätze untereinander. Je Seite den Block
„Leistungen / Welche Bewertung benötigen Sie wirklich?“, die FAQ-Antworten
und die vier Ablauf-Schritte mit echten Ortsbezügen (Ortsteile,
Bodenrichtwert-Zonen aus der eigenen Tabelle) neu schreiben. FAQ in JSON-LD
und sichtbarem Text identisch halten. Keine erfundenen Zahlen, keine
Anerkennungszusagen. Reihenfolge: Langenhagen, Seelze, Garbsen, Laatzen,
dann der Rest. Messung: Satzvergleich gegen alle anderen Seiten < 20 %.

### T-23 · Apex-Weiterleitung 307 → 308
**Status: offen · Eigentümer: Inhaber**
`https://3dimmobilienbewertung.de/` leitet mit **307 (vorläufig)** auf www.
Die Apex-Domain hängt an keinem Projekt im Team `3dimmobilienbewertungs-projects`
(Vercel-API: nur `www` im Projekt `website-probe`). In Vercel unter
Domains prüfen, wo die Apex-Domain liegt, und auf „Redirect to
www.3dimmobilienbewertung.de · 308 Permanent“ stellen.

### T-24 · Ladezeit Mobil
**Status: teilweise erledigt (CC, `4935d7f`)** — PSI mobil vorher 73, LCP 6,1 s. Erledigt: Hero 700w, LCP-Preload, Font-Preload, WebP-Logo. Offen: sechs render-blockierende CSS-Dateien (Bündelung erst, wenn das Redesign stabil ist, sonst laufen Bündel und Einzeldateien auseinander).

### T-25 · Kundenstimmen auf Ortsseiten (T-17) – zusätzlich „rechtssicher“ im Zitat
**Status: beim Inhaber** — Hemmingen zeigt „Martina & Jürgen F.“ mit „präzise, schnell und rechtssicher“. Gleiche Entscheidung wie T-17.

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
| T-07b | 51 Inline-Zentrierungen an `.sec-head` entfernt, 25 Dateien | CC | `1b27bb8` |
| T-21b | Textbausteine Isernhagen/Burgwedel/Schwarmstedt eigenständig, FAQ-Schema nachgezogen | CC | `1e9920f` |
| T-15 | Redesign von `.brand-home` auf `.brand-editorial` ausgeweitet — gilt jetzt für alle 54 Seiten | CC | `1b27bb8` |

**Ladegewicht gesamt:** rund 118 KB leichter als am Morgen des 21.10. — eine
Schriftdatei weniger plus kleinere Bilder, trotz besserer Darstellung.
