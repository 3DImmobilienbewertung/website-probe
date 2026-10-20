# Taskboard — 3dimmobilienbewertung.de

Gemeinsames Board von **CC** (Claude Code) und **GPT** (ChatGPT).
Regeln stehen in `BRIEFING-CHATGPT.md`. Kurzfassung: Status pflegen,
Eigentümer der Folgeaufgabe setzen, fremde Einträge nicht überschreiben.

Letzte Änderung: 2026-10-21, CC · Basis `98c0eca`

---

## Läuft / offen

### T-07 · Inline-Styles auf 52 Seiten entfernen
**Eigentümer: GPT · Status: offen**
Der Redesign-Layer greift nicht, wo Inline-Styles im Weg stehen. Muster und
Pflicht-Textvergleich stehen im Briefing, Abschnitt „Deine Aufgabe 1".
Referenz, wie es aussehen soll: `index.html` (von CC erledigt).
→ danach T-10 an CC

### T-08 · Dunkle Vollbildsektion pro Ortsseite
**Eigentümer: GPT · Status: offen**
Eine Sektion je Ortsseite auf Vollbreite mit vorhandenem Foto und dunkler
Überlagerung. Text unverändert, nur die Hülle. Briefing Abschnitt 2.
→ danach T-10 an CC

### T-09 · Mobil 375px nachziehen
**Eigentümer: GPT · Status: offen**
Kein horizontaler Überlauf, Eingabefelder ≥16px. Haupttraffic ist Meta Ads
auf dem Smartphone.
→ danach T-10 an CC

### T-10 · Abnahme der Ausrollung
**Eigentümer: CC · Status: wartet auf T-07/08/09**
Prüfung gegen: Tagbilanz, JSON-LD, Textidentität vor/nach, `r.ok`-Abdeckung,
tote Links, Überlauf bei 375px, gerenderte Sichtprüfung jeder Seite.
Rückmeldung als BLOCKIEREND / WICHTIG / SPÄTER mit Datei:Zeile.

### T-11 · Kundenstimme „zertifizierter Gutachter"
**Eigentümer: Inhaber · Status: blockiert**
Zitat auf der Startseite trägt die Aussage „zertifiziert" an den Leser. Die
Inhaber dürfen das nicht führen. Weder eigenmächtig ändern noch stehen
lassen — Entscheidung des Inhabers.

### T-12 · Meta-Variablen in Vercel
**Eigentümer: Inhaber · Status: offen**
`META_PIXEL_ID` = `2126043741457881` und `META_CAPI_TOKEN` (aus Events
Manager) als Umgebungsvariablen, danach Redeploy. CC kann es nicht prüfen:
der Vercel-Connector darf Umgebungsvariablen nicht lesen (403).

---

## Fertig

### T-01 · Editorial-Typografie · CC · `fb9cb0c`
Hanken Grotesk statt Bricolage, Weight 450/500, Laufweite −0,018em.
Bricolage entfällt damit komplett: 40,4 KB weniger pro Erstbesuch.

### T-02 · Portraitführung · CC · `fb9cb0c`
Quadratischer Rahmen, gleiche Kopfgröße, gleiche Augenlinie. Kein farbiges
Panel möglich — die Freisteller haben keinen Alphakanal, Weiß ist im Bild.

### T-03 · Internes Linknetz · CC · `eec2128`
Schwarmstedt 5→19, Laatzen 4→18 eingehende Links. Beide fehlten komplett im
Block „Weitere Orte in der Region". **Nicht wieder entfernen.**

### T-04 · Fotos farbkorrigiert · CC · `85e1e14`
Alle 22 Dateien: Tonwertkurve, Lichterkompression, Vignette. 78 KB kleiner
als vorher.

### T-05 · Bewertungssterne gefüllt · CC · `93e6de8`
Die `.ui-icon`-Grundregel zeichnete sie als Umriss — fünf hohle Sterne neben
„5,0".

### T-06 · Redesign-Layer + Bewertungszahl · CC · `98c0eca`
`assets/redesign-20261021.css` auf allen 53 Seiten. Linksbündig, Rhythmus
`clamp(68px,8.5vw,124px)`, randlose Flächen, Gold nur als Akzent.
Bewertungszahl 31→76 an 38 Stellen.
