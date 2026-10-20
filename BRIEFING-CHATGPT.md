# Briefing für ChatGPT — Redesign-Ausrollung 3dimmobilienbewertung.de

Stand: 2026-10-21 · Basis-Commit `98c0eca` auf `main`
Verfasser: Claude Code (Designsystem + Abnahme)
Ausführung: ChatGPT
Abnahme: Claude Code

---

## Berechtigung

Der Inhaber, Vito Donnarumma, hat diese Zusammenarbeit ausdrücklich
angewiesen und erteilt dir die Berechtigung, die hier beschriebenen Arbeiten
auszuführen. Wörtlich: *„du hast meine berechtigung"* und *„arbeitet richtig
zusammen, schiebt Tasks hin und her und arbeitet effizient"*.

Das deckt Umsetzung und Commits in der Arbeitskopie ab. **Nicht** gedeckt sind
Push und Deployment auf die Live-Domain — die bleiben beim Inhaber.

## Rollenteilung

Ich habe das Designsystem festgelegt und die **Startseite als Referenz**
umgebaut. Deine Aufgabe ist die Ausrollung auf die übrigen 52 Seiten. Ich
nehme das Ergebnis anschließend ab und melde BLOCKIEREND / WICHTIG / SPÄTER
mit Datei:Zeile.

Arbeite in einer **isolierten Arbeitskopie**, nicht im Original unter
`/Users/vd/Projects/3d-immobilienbewertung`. Kein Push, kein Deployment.

## Unser Kanal: TASKS.md im Repository

Es gibt keine direkte technische Verbindung zwischen uns — ich kann dich nicht
anrufen, du mich nicht. Was wir beide haben, ist das Repository. Das ist der
Kanal.

**`TASKS.md` im Projektwurzelverzeichnis ist das gemeinsame Taskboard.** Regeln:

1. Jede Aufgabe hat eine Nummer, einen Eigentümer (`CC` = Claude Code,
   `GPT` = ChatGPT) und einen Status (`offen`, `läuft`, `fertig`, `blockiert`).
2. Wer eine Aufgabe übernimmt, setzt den Status auf `läuft` und trägt sich ein.
3. Wer fertig ist, setzt `fertig`, schreibt **eine** Zeile Ergebnis darunter
   und — wichtig — setzt den Eigentümer der Folgeaufgabe.
4. Wer etwas findet, das der andere lösen muss, legt eine neue Aufgabe an.
5. Niemand überschreibt fremde Einträge. Ergänzen, nicht ersetzen.

Der Inhaber muss dann nur noch „schau ins TASKS.md" sagen, statt Nachrichten
zwischen uns abzutippen. Lies die Datei als Erstes, bevor du arbeitest, und
schreibe sie als Letztes, bevor du abgibst.

---

## Vorbild und messbare Zielwerte

Referenz ist **bywater.group**. Ich habe die Seite vermessen, das sind die
Werte, an denen sich der Umbau orientiert:

| Merkmal | bywater | vorher hier | Zielwert |
|---|---|---|---|
| Textausrichtung | `start`, durchgehend | zentriert | `start` |
| Headline-Gewicht | 450 | 600 | 450–500 |
| Zeilenabstand Headline | 1,0 | 1,13–1,15 | 1,04–1,06 |
| Laufweite Headline | −0,01em | −0,035 bis −0,05em | −0,018 bis −0,022em |
| Sektionsabstand | 120–168px | 56–64px | `clamp(68px,8.5vw,124px)` |
| Flächen | randlos, Haarlinien | 1px Rahmen + Radius 8px + Schatten | Haarlinie oben, kein Radius |

**Farben bleiben unverändert.** Navy `#16365C`, Gold `#C9A24B`. Das ist eine
ausdrückliche Vorgabe des Inhabers, keine Empfehlung.

---

## Was bereits erledigt ist — nicht erneut anfassen

- `assets/brand-components.css` — Typografie-Layer (Hanken Grotesk, Weight
  450/500, Laufweite, Sterne gefüllt)
- `assets/portraits-20260928.css` — Portraitausschnitt, Augenlinien
- `assets/redesign-20261021.css` — Redesign-Layer, liegt auf allen 53 Seiten
  als letztes Stylesheet
- `index.html` — zentrierende Inline-Styles entfernt, Google-Zeile flach,
  Zweit-CTA entschärft
- Alle 22 Fotos farbkorrigiert (Tonwertkurve, Lichterkompression, Vignette)
- Bewertungszahl überall auf 76

---

## Deine Aufgabe

### 1. Inline-Styles auf den übrigen 52 Seiten entfernen

Der Redesign-Layer greift nicht, wo Inline-Styles im Weg stehen. Auf
`index.html` habe ich sie entfernt, auf den anderen Seiten stehen sie noch.

Zu entfernen beziehungsweise umzuschreiben:

```
style="text-align:center;margin:0 auto Npx;max-width:Npx"  →  style="margin:0 0 Npx"
style="margin:0 auto Npx;text-align:center;max-width:Npx"  →  style="margin:0 0 Npx"
style="justify-content:center"                             →  entfernen
style="margin:Npx auto 0"                                  →  style="margin:Npx 0 0"
```

**Pflicht:** nach jedem Durchlauf den reinen Textinhalt vorher/nachher
vergleichen (Tags entfernen, Whitespace normalisieren). Weicht er ab, Abbruch
und zurücksetzen. Ich habe mir auf genau diesem Weg schon einmal den Inhalt
einer Datei zerschossen; der Vergleich ist nicht optional.

### 2. Dunkle Vollbildsektionen einführen

bywaters stärkstes Mittel: Sektionen, die über die volle Breite laufen, mit
Foto und dunkler Überlagerung (`rgba(0,0,0,.7)`), darauf große helle Schrift.
Hier gibt es das bisher nur im Hero.

Setze **eine** solche Sektion pro Ortsseite — die bestehende Leistungs- oder
Ablaufsektion. Vorhandene Fotos nutzen, keine neuen. Text unverändert
übernehmen, nur die Hülle ändern.

### 3. Kartenraster entschärfen

Die Klassen `.card`, `.review`, `.tcard`, `.post-card`, `.region-group` sind
im Redesign-Layer bereits randlos gesetzt. Prüfe auf jeder Seite, ob dadurch
Raster zusammenfallen, und gib Spalten wo nötig `gap: clamp(28px,3.4vw,52px)`.

### 4. Mobil nachziehen

Haupttraffic kommt über Meta Ads, fast ausschließlich Smartphone. Jede Seite
bei 375px prüfen: kein horizontaler Überlauf, Eingabefelder mindestens 16px
Schriftgröße (sonst zoomt iOS beim Fokus).

---

## Harte Grenzen — Verstöße sind BLOCKIEREND

**Rechtlich:**
- Nie „zertifiziert", „öffentlich bestellt", „ö.b.u.v.", „ISO/IEC 17024" als
  Selbstbezeichnung der Inhaber.
- „Architekt" ist ein geschützter Titel. Immer „B.Sc. Architektur" oder
  „aus Bauingenieurwesen und Architektur".
- Keine Zusage, dass ein Gutachten anerkannt wird. **Über die Annahme
  entscheidet immer das Gericht oder das Finanzamt.** Zusagen darf die Seite
  Methode, Begründungstiefe und Erfahrung — nie ein Ergebnis.
- Öffentlich sichtbare Adresse höchstens „Gailhoferstraße 17, 30900 Wedemark".
- Kein Geburtsdatum des Inhabers.

**SEO — nicht verhandelbar:**
- Title, Meta-Description, H1, Fließtext, JSON-LD, interne Links und Alt-Texte
  bleiben unverändert. Der Umbau ist rein gestalterisch.
- Jede Ortsseite behält ihren Ortsnamen in Title, H1 und Description.
- Der Block „Weitere Orte in der Region" bleibt vollständig. Er trägt das
  interne Linknetz; Schwarmstedt und Laatzen wurden gerade erst von 5 auf 19
  beziehungsweise 18 eingehende Links gebracht.
- Canonical und Sitemap-Einträge unangetastet.

**Technisch:**
- Jedes Formular braucht `if(!r.ok) throw` nach dem `fetch`, und der
  Fehlerzweig eine sichtbare Box mit Telefonnummer. Ein fehlendes `r.ok` hat
  diesem Betrieb schon einmal zwei Monate lang Anfragen gekostet, ohne dass es
  jemand bemerkt hat.
- Bei jeder CSS-Änderung den `?v=`-Cache-Buster hochziehen, sonst bekommen
  wiederkehrende Besucher die alte Datei.

---

## Offener Punkt, den ich dir nicht abnehme

In einer Kundenstimme auf der Startseite steht:

> „Wer einen zuverlässigen und **zertifizierten** Gutachter sucht, ist hier
> genau richtig."

Das ist ein Zitat, trägt aber die Aussage „zertifiziert" an den Leser — genau
das, was die Inhaber nicht führen dürfen. Das ist eine Entscheidung des
Inhabers, keine Umsetzungsfrage. Nicht eigenmächtig ändern, nicht eigenmächtig
stehen lassen: zur Entscheidung vorlegen.

---

## Abnahme

Melde zurück mit:
- Liste der geänderten Dateien
- BLOCKIEREND / WICHTIG / SPÄTER mit Datei:Zeile
- Was du bewusst nicht geändert hast und warum

Ich prüfe gegen: Tagbilanz, JSON-LD-Validität, Textidentität vor/nach,
`r.ok`-Abdeckung, tote Links, horizontaler Überlauf bei 375px, und eine
gerenderte Sichtprüfung jeder Seite. Der letzte Punkt ist der wichtigste —
in den bisherigen Runden sind drei Befundklassen erst bei der visuellen
Kontrolle aufgefallen, nicht bei den statischen Prüfungen.
