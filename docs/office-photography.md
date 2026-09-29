# Eigene Büro- und Arbeitsfotos

Stand: 29. September 2026. Lokale Vorschau, noch nicht veröffentlicht.

## Gestaltungsentscheidung

Das gemeinsame Teamfoto ersetzt ausschließlich das Porträtpaar im Startseiten-Hero.
Die Einzelporträts bleiben im Team-Bereich und auf „Über uns“. Arbeitsfotos stehen
neben dem passenden Inhalt, nicht in einem dekorativen Karussell. Es werden keine
Kundenfälle, Standorte, Ergebnisse oder Qualifikationen aus den Bildern abgeleitet.

## Zuordnung

| Original | Verwendung |
| --- | --- |
| Nanvit besprechung.png | Startseiten-Hero; bestehende Kompetenzabschnitte Wedemark, Isernhagen, Burgwedel, Seelze |
| Nanvit besprechung 2.png | Einstieg „Über uns“ |
| Nandino aktion.png | Besichtigung im Ablauf; Hausbewertung |
| Nandino Tisch.png | Unterlagenprüfung im Ablauf; Unterlagen-Checkliste |
| Vito Sitz 1.png | Auswertung im Ablauf |
| Nandino Sitz.png | Persönlicher Kontakt auf der Startseite |
| Vito Sitz.png | Immobilienbewertung Hannover |
| Nandino steh.png | Wohnungsbewertung Hannover |
| Nandino steh kon.png | Ablauf Restnutzungsdauergutachten |

Alle neun Motive werden verwendet: 15 Bildplatzierungen auf elf Seiten.

## Gemeinsames Fotomuster

- Stylesheet: `assets/office-photography.css`, nach den bestehenden Designregeln.
- `office-photo`: semantisches `figure` mit Bildbeschreibung und `figcaption`.
- `office-shot`: responsives `img`, feste intrinsische Maße gegen Layoutsprünge.
- `office-photo--team`: 3:2, beide Personen im Bild. Auf der Startseite und bei
  „Über uns“ als großflächiges 2:1-Bild, mobil weiterhin 3:2.
- Startseiten-Einstieg: Nutzen und Anfrage nebeneinander, Teamfoto über die gesamte
  Inhaltsbreite (1184 px bei 1440 px Viewport). Mobil stehen die Kontaktaktionen
  vor dem Foto; keine Schrift liegt über den Gesichtern.
- Motivvarianten steuern `--photo-position`, damit Gesichter, Tablet und Unterlagen
  trotz unterschiedlicher Bildflächen erkennbar bleiben. Die Quelldateien werden
  nicht beschnitten oder retuschiert; der Ausschnitt entsteht nur im Layout.
- `office-feature`: Bild und vorhandener Text nebeneinander, unter 701 px gestapelt.
- `office-process`: asymmetrische Bildstrecke mit einer großen Besichtigung links
  und zwei ergänzenden Arbeitssituationen rechts; mobil untereinander ohne Slider.
- Weiß/Navy und vorhandene Schrift-Tokens; helle Bildunterschriften auf Navy.
- Dezentes Anheben um 3 px beim Maus-Hover und einmalige kurze Eingangsbewegung
  der Hero-Fotos. Beides nur bei `prefers-reduced-motion: no-preference`, Hover
  zusätzlich nur mit feinem Zeiger. Keine unsichtbar startenden Inhalte, Overlays,
  Popups, Autoplay oder zusätzlichen Tabstopps. Fotos bleiben nicht interaktiv.
- Keine neue JavaScript-Abhängigkeit, kein neuer Trackingdienst.
- Die Bildgruppe der Druck-Checkliste wird im Ausdruck ausgeblendet.

## Bildauslieferung

Originale unverändert. WebP mit Qualität 81, keine EXIF-Metadaten, keine Farbfilter.
Je Motiv zwei Auflösungen: 480/960 px für Hochformat, 640/1440 px für Teamfotos.
Auswahl über `srcset`/`sizes`. Nur die beiden Einstiegsbilder haben hohe Priorität;
alle übrigen neuen Fotos werden verzögert geladen. Jede Datei ist kleiner als
130 KB. Das ist eine Dateigrößenprüfung, keine gemessene Core-Web-Vitals-Aussage.

## Abnahme

- Elf Seiten bei 375, 768 und 1440 px: 33 Browserprüfungen, keine horizontalen
  Überläufe oder Bildrahmen außerhalb des Viewports.
- Visuelle Kontrolle der neun Motive in ihren Kontexten. Zusätzlich korrigiert:
  Kontrast der Kontakt-Bildunterschrift und schmale Schritttitel beim RND-Ablauf.
- Vierzehn vorhandene/erweiterte Prüfprogramme bestanden, darunter Formularfehler,
  Erfolgsmeldungen, Anfrage-Check, Bildgrößen, Zuordnung, Verlinkung und SEO-Bestand.
- Visuelle Prüfung des neuen Heros bei 375, 768 und 1440 px; Bildausschnitte
  nach Screenshots korrigiert. Vergrößerte Bilder erhalten passende `sizes`.
- Zusätzlicher Bestandsfehler behoben: `.tcard` erhielt durch die gemeinsame
  Kartenregel einen weißen Hintergrund, behielt aber weiße Textfarben der dunklen
  Sektion. Text, Namen und Ortsangaben nun dunkel; alle acht betroffenen Seiten
  im Browser geprüft und Stylesheet-Version dort aktualisiert.
- Mobilen Anfrageweg mit Menü, vier Schritten, Zurück, simuliertem Versandfehler
  und anschließend bestätigtem Test-Erfolg geprüft. Lokaler Server führt den
  echten Handler mit einem simulierten Mail-Anbieter aus. Keine E-Mails versendet.
- SEO-Ergänzungen und gezielte Änderungen sind separat in `seo-2026-09-28.md`
  dokumentiert. Bestehende URLs, Anker, Medien und Formularverarbeitung erhalten.
- Die Medien-Bestandprüfung erlaubt nur die ausdrücklich gewünschten neuen Fotos
  und den Austausch des Hero-Porträtpaars; andere Medien bleiben unverändert.

Zur Regression: `tests/office-photography.py`, `tests/portraits.py`,
`tests/redesign-preservation.py`, `tests/site-design.py`, `tests/regional-design.py`.
