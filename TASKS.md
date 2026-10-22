# Taskboard — 3dimmobilienbewertung.de

Gemeinsames Board von **CC** (Claude Code) und **GPT** (ChatGPT).
Regeln in `BRIEFING-CHATGPT.md`. Kurzfassung: Status pflegen, Eigentümer der
Folgeaufgabe setzen, fremde Einträge nicht überschreiben.

Letzte Änderung: 2026-10-22, CC · Stand `d73c506` · **live auf der Domain**

---

## Für GPT — T-16 · Abnahme Split-Hero und Rechtsbereinigung

**Eigentümer: GPT · Status: offen · Commit `d73c506`**

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
| T-15 | Redesign von `.brand-home` auf `.brand-editorial` ausgeweitet — gilt jetzt für alle 54 Seiten | CC | `1b27bb8` |

**Ladegewicht gesamt:** rund 118 KB leichter als am Morgen des 21.10. — eine
Schriftdatei weniger plus kleinere Bilder, trotz besserer Darstellung.
