# Erzeugt 20 Beitraege fuer das Google-Unternehmensprofil: Bilder (1200x900),
# beitraege.md und uebersicht.html. Aufruf aus dem Projektordner:
#   python3 docs/google-beitraege/beitraege.py
import sys, os, json, datetime, html
sys.path.append('/Users/vd/Library/Python/3.9/lib/python/site-packages')
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'docs', 'google-beitraege')
A = lambda f: os.path.join(ROOT, 'assets', f)
SITE = 'https://www.3dimmobilienbewertung.de'
NAVY, GOLD, PAPIER, INK, MUTED = (22, 54, 92), (201, 162, 75), (246, 244, 240), (16, 36, 61), (86, 112, 142)
FONT = '/System/Library/Fonts/Avenir Next.ttc'
F = lambda size, w='bold': ImageFont.truetype(FONT, size, index={'bold': 0, 'demi': 2, 'medium': 5, 'regular': 7}[w])
W, H = 1200, 900
QUELLE = 'Quelle: Gutachterausschüsse für Grundstückswerte Niedersachsen, BORIS.NI / LGLN, dl-de/by-2-0, Stichtag 01.01.2026'
BRW = json.load(open(os.path.join(OUT, 'bodenrichtwerte.json'), encoding='utf-8'))
START = datetime.date(2026, 10, 24)

def logo_chip(im, x=48, y=44, dark=False):
    logo = Image.open(A('logo.png')).convert('RGBA')
    h = 46; logo = logo.resize((round(logo.width * h / logo.height), h), Image.LANCZOS)
    d = ImageDraw.Draw(im)
    if not dark:
        d.rounded_rectangle((x, y, x + logo.width + 36, y + h + 26), 10, fill=(255, 255, 255))
        im.paste(logo, (x + 18, y + 13), logo)
    else:
        im.paste(logo, (x, y), logo)

def umbruch(d, text, font, breite):
    zeilen, z = [], ''
    for wort in text.split():
        t = (z + ' ' + wort).strip()
        if d.textlength(t, font=font) <= breite: z = t
        else: zeilen.append(z); z = wort
    return zeilen + [z]

def foto(post):
    im = Image.open(A(post['bild'])).convert('RGB')
    fy = post.get('fokus', 0.4)
    s = max(W / im.width, H / im.height); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    x = (im.width - W) // 2; y = round((im.height - H) * fy)
    im = im.crop((x, y, x + W, y + H))
    verlauf = Image.new('L', (1, H))
    for j in range(H):
        t = max(0, (j - H * 0.30) / (H * 0.70)); verlauf.putpixel((0, j), round(248 * min(1, t * 1.15) ** 1.1))
    navy = Image.new('RGB', (W, H), NAVY)
    im = Image.composite(navy, im, verlauf.resize((W, H)))
    d = ImageDraw.Draw(im)
    fh = F(60); zeilen = umbruch(d, post['titel'], fh, W - 140)
    y = H - 70 - len(zeilen) * 70
    d.rectangle((60, y - 62, 124, y - 58), fill=GOLD)
    eb = post['ort'].upper(); fe = F(24, 'demi')
    d.rectangle((60, y - 52, 60 + d.textlength(eb, font=fe) + 22, y - 10), fill=NAVY)
    d.text((71, y - 44), eb, font=fe, fill=GOLD)
    for i, z in enumerate(zeilen): d.text((68, y + i * 70), z, font=fh, fill=(255, 255, 255))
    logo_chip(im)
    return im

def datenkarte(post):
    im = Image.new('RGB', (W, H), PAPIER); d = ImageDraw.Draw(im)
    logo_chip(im, 70, 56, dark=True)
    d.text((70, 140), post['ort'].upper(), font=F(24, 'demi'), fill=(156, 122, 46))
    d.text((68, 172), post['titel'], font=F(52), fill=INK)
    zeilen = post['zonen']; mx = max(v for _, v in zeilen)
    y0, zh = 278, 62
    bx = 70 + max(d.textlength(n, font=F(26, 'medium')) for n, _ in zeilen) + 34; bx = int(max(bx, 420)); bw = W - 70 - bx - 140
    for i, (name, wert) in enumerate(zeilen):
        y = y0 + i * zh
        d.text((70, y + 8), name, font=F(26, 'medium'), fill=INK)
        l = round(bw * wert / mx)
        d.rectangle((bx, y + 6, bx + l, y + 44), fill=GOLD if i == 0 else NAVY)
        d.text((bx + l + 14, y + 8), f'{wert} €/m²', font=F(26, 'demi'), fill=INK)
    d.line((70, H - 92, W - 70, H - 92), fill=(226, 220, 209), width=2)
    d.text((70, H - 74), 'Bodenrichtwerte Wohnbauland (EFH-Zonen) · Wert des Bodens, nicht des Hauses', font=F(20, 'medium'), fill=MUTED)
    d.text((70, H - 46), QUELLE, font=F(17, 'regular'), fill=MUTED)
    return im

def infokarte(post):
    im = Image.new('RGB', (W, H), NAVY); d = ImageDraw.Draw(im)
    logo_chip(im)
    d.text((70, 168), post['ort'].upper(), font=F(24, 'demi'), fill=GOLD)
    d.text((68, 200), post['titel'], font=F(54), fill=(255, 255, 255))
    n = len(post['bloecke']); gap = 28; bw = (W - 140 - gap * (n - 1)) // n
    for i, (kopf, unter) in enumerate(post['bloecke']):
        x = 70 + i * (bw + gap); y = 360
        d.rectangle((x, y, x + bw, y + 400), fill=(30, 66, 108))
        d.rectangle((x, y, x + bw, y + 6), fill=GOLD)
        d.text((x + 28, y + 40), f'0{i + 1}', font=F(26, 'demi'), fill=GOLD)
        for j, z in enumerate(umbruch(d, kopf, F(36), bw - 56)): d.text((x + 28, y + 86 + j * 44), z, font=F(36), fill=(255, 255, 255))
        for j, z in enumerate(umbruch(d, unter, F(24, 'medium'), bw - 56)): d.text((x + 28, y + 196 + j * 34), z, font=F(24, 'medium'), fill=(198, 212, 230))
    d.text((70, H - 66), 'www.3dimmobilienbewertung.de', font=F(22, 'demi'), fill=(198, 212, 230))
    return im

def zonen(ort, namen=None, n=7):
    rows = BRW[ort]
    if namen: rows = [r for r in rows if r[0] in namen]
    return [tuple(r) for r in rows[:n]]

P = []
def post(**k): P.append(k)

post(typ='foto', bild='hero-team-1536.webp', fokus=0.35, ort='Wedemark · Region Hannover',
 titel='Wer Ihre Immobilie bewertet', link='/ueber-uns.html', knopf='Mehr erfahren',
 text='''Wer bewertet eigentlich Ihre Immobilie? Bei 3D Immobilienbewertung sind es immer dieselben zwei Personen: Nandino Donnarumma (M.Sc. Bauingenieurwesen) und Vito Donnarumma (B.Sc. Architektur).

Von unserem Büro in der Wedemark aus bewerten wir Häuser, Eigentumswohnungen und Grundstücke in Hannover und der ganzen Region – von Langenhagen und Isernhagen über Burgwedel bis Schwarmstedt.

Was das für Sie heißt:
• Wir besichtigen jedes Objekt selbst – kein Online-Schätzwert
• Wir sehen auch Bausubstanz, Dach, Keller und Sanierungsbedarf
• Sie erhalten ein Kurzgutachten oder ein Verkehrswertgutachten nach §194 BauGB
• Das Erstgespräch ist kostenlos, den Festpreis kennen Sie vor dem Auftrag

Welche Immobilie möchten Sie bewerten lassen?''')

post(typ='daten', ort='Isernhagen', titel='Bodenrichtwerte Isernhagen 2026',
 zonen=zonen('isernhagen', ['Altwarmbüchen', 'Isernhagen HB-Raulsweg', 'Altwarmbüchen-Südost', 'Isernhagen HB-Vor der Hahle', 'Isernhagen NB-Nordost', 'Isernhagen KB-Hagenstrasse', 'Isernhagen KB-Kirchstrasse']),
 link='/immobilienbewertung-isernhagen.html', knopf='Mehr erfahren',
 text='''Bodenrichtwerte Isernhagen 2026: In Altwarmbüchen und mehreren Zonen in Isernhagen H.B. weist BORIS.NI zum Stichtag 01.01.2026 rund 470 €/m² für Wohnbauland aus, in Teilen von Isernhagen K.B. rund 430 €/m².

Wichtig für Eigentümer: Der Bodenrichtwert gilt nur für den Grund und Boden einer Richtwertzone. Den Verkehrswert Ihres Hauses bestimmen erst Gebäude, Baujahr, Zustand und genaue Lage – auf einer Hofstelle in den Bauerschaften ganz anders als bei einer Wohnung in Altwarmbüchen.

Genau diese Merkmale nehmen wir beim Ortstermin auf. Auf unserer Isernhagen-Seite finden Sie die Werte weiterer Zonen und den Ablauf einer Bewertung.

Quelle: Gutachterausschüsse für Grundstückswerte Niedersachsen, BORIS.NI / LGLN, Datenlizenz Deutschland – Namensnennung 2.0.''')

post(typ='foto', bild='office-vito-auswertung-960.webp', fokus=0.45, ort='Vermieter · Restnutzungsdauer',
 titel='Restnutzungsdauer: Was sich geändert hat', link='/restnutzungsdauergutachten-hannover.html', knopf='Mehr erfahren',
 text='''Vermieter aufgepasst: Das BMF-Schreiben vom 22.02.2023 zur kürzeren Nutzungsdauer von Gebäuden wurde mit BMF-Schreiben vom 01.12.2025 ersatzlos aufgehoben. Die darin geforderten besonderen Anforderungen an die Person des Gutachters gelten damit nicht mehr.

Was bleibt: Das Finanzamt prüft ein Gutachten zur Restnutzungsdauer weiterhin inhaltlich. Nach der Rechtsprechung des Bundesfinanzhofs reicht ein bloßer Verweis auf die Modellwerte der ImmoWertV nicht – der tatsächliche Zustand des Gebäudes muss nachvollziehbar dargelegt werden.

Für wen sich eine Prüfung lohnen kann:
• vermietete Häuser und Wohnungen mit älterer Bausubstanz
• Gebäude mit Sanierungsstau an Dach, Fassade oder Haustechnik
• Kauf in den letzten Jahren mit hohem Gebäudeanteil am Kaufpreis

Ob sich ein Gutachten für Sie rechnet, klären wir kostenlos vorab. Ein bestimmtes Ergebnis sagen wir nicht zu – über die Anerkennung entscheidet das Finanzamt.''')

post(typ='foto', bild='office-nandino-besichtigung-960.webp', fokus=0.62, ort='Großburgwedel',
 titel='Doppelhaushälfte richtig bewerten', link='/blog/doppelhaushaelfte-reihenhaus-bewerten-grossburgwedel.html', knopf='Mehr erfahren',
 text='''Doppelhaushälfte oder Reihenhaus in Großburgwedel bewerten? Dann zählt mehr als die Wohnfläche.

Worauf wir bei der Besichtigung besonders achten:
• Grundstücksanteil und Zuschnitt – gerade bei geteilten Grundstücken
• gemeinsame Bauteile wie Brandwand, Dach und Leitungen
• Anbauten und Wintergärten – und ob sie genehmigt sind
• Modernisierungen: was ausgeführt ist und was nur geplant war

In Großburgwedel liegen die Bodenrichtwerte zwischen 470 €/m² im Ortskern und 270 €/m² in der Zone Am Heisterholz (BORIS.NI, Stichtag 01.01.2026). Schon das zeigt: Die genaue Lage macht einen großen Unterschied.

In unserem Ratgeber erklären wir, wie wir Doppelhaushälften und Reihenhäuser in Burgwedel bewerten.''')

post(typ='foto', bild='office-team-besprechung-1440.webp', fokus=0.4, ort='Erbschaft',
 titel='Immobilie geerbt – was jetzt?', link='/immobilienbewertung-erbschaft.html', knopf='Mehr erfahren',
 text='''Eine Immobilie geerbt? Für Erbschaftsteuer, Erbauseinandersetzung oder einen späteren Verkauf brauchen Sie meist einen nachvollziehbaren Verkehrswert.

Drei Situationen, in denen ein Gutachten oft hilft:
• Das Finanzamt setzt einen Wert an, der Ihnen zu hoch erscheint. Für den Nachweis eines niedrigeren gemeinen Werts nennt § 198 BewG eigene Anforderungen.
• Mehrere Erben wollen fair aufteilen, oder einer zahlt die anderen aus.
• Das Haus soll verkauft werden, und Sie möchten einen realistischen Preis kennen.

Bevor Sie ein Gutachten beauftragen, klären wir mit Ihnen, wofür es gebraucht wird und welche Anforderungen dafür gelten. Ob das Finanzamt ein Gutachten anerkennt, entscheidet es selbst.

Mehr zur Bewertung bei Erbschaft in Hannover und der Region auf unserer Website.''')

post(typ='info', ort='Schwarmstedt · Samtgemeinde', titel='Einen Resthof bewerten wir in Teilen',
 bloecke=[('Wohnhaus', 'Baujahr, Zustand, Modernisierungen'), ('Scheune & Nebengebäude', 'Heutige Nutzbarkeit, Bausubstanz'), ('Flächen & Lage', 'Hof, Garten, Nähe zu Aller und Leine')],
 link='/blog/resthof-bewerten-schwarmstedt.html', knopf='Mehr erfahren',
 text='''Resthof in der Samtgemeinde Schwarmstedt bewerten? Ein Hof ist mehr als ein Wohnhaus – genau deshalb passt dafür kein Online-Rechner.

Wir bewerten die Teile einzeln:
• das Wohnhaus mit Baujahr, Zustand und Modernisierungen
• Scheunen, Ställe und Nebengebäude – mit der Frage, wie sie heute noch genutzt werden können
• Hofflächen, Gärten und angrenzende Flächen
• die Lage zu Aller und Leine, etwa mit Blick auf Überschwemmungsgebiete

So entsteht ein Wert, den Sie nachvollziehen können – ob für Verkauf, Hofübergabe oder Erbschaft. Zum Ortstermin kommen wir aus der Wedemark nach Schwarmstedt, Buchholz (Aller), Essel, Gilten und Lindwedel.''')

post(typ='foto', bild='hero-hannover-fassade-quer-1600.webp', fokus=0.35, ort='Hannover',
 titel='Altbauwohnung in Hannover bewerten', link='/blog/altbauwohnung-bewerten-hannover.html', knopf='Mehr erfahren',
 text='''Altbauwohnung in Hannover bewerten – ob in der List, in Linden, der Oststadt oder der Südstadt: Bei Eigentumswohnungen entscheidet nicht nur die Wohnung selbst.

Was wir uns ansehen:
• Teilungserklärung: Was gehört zu Ihrem Sondereigentum, was ist Gemeinschaftseigentum?
• Protokolle der Eigentümerversammlung: Stehen Dach, Fassade oder Heizung an?
• Erhaltungsrücklage und Wirtschaftsplan
• Grundriss, Deckenhöhe, Etage und Modernisierungen

Eine frisch renovierte Wohnung kann in einem Haus mit großem Sanierungsbedarf liegen. Deshalb bewerten wir Wohnung und Gebäude zusammen.

In unserem Ratgeber lesen Sie, welche Unterlagen Sie für die Bewertung einer Altbauwohnung in Hannover brauchen.''')

post(typ='daten', ort='Langenhagen', titel='Bodenrichtwerte Langenhagen 2026',
 zonen=zonen('langenhagen', ['Godshorn', 'Langenhagen-Bahnhof', 'Langenhagen-Neue Bult', 'Langenhagen-Ost', 'Langenhagen-Süd', 'Engelbostel', 'Kaltenweide']),
 link='/immobilienbewertung-langenhagen.html', knopf='Mehr erfahren',
 text='''Bodenrichtwerte Langenhagen 2026: Godshorn führt mit 430 €/m², gefolgt von den Zonen am Bahnhof (400 €/m²) und an der Neuen Bult (380 €/m²). Kaltenweide liegt bei 310 €/m² (BORIS.NI, Stichtag 01.01.2026).

Für Ihre Immobilie heißt das: Schon innerhalb von Langenhagen unterscheidet sich allein der Bodenwert um über 100 €/m². Dazu kommen Gebäude, Zustand und Lagefaktoren wie Verkehrsanbindung oder die Nähe zum Flughafen.

Wir bewerten Häuser und Wohnungen in Langenhagen, Godshorn, Kaltenweide, Krähenwinkel und Engelbostel mit eigener Besichtigung.

Quelle: Gutachterausschüsse für Grundstückswerte Niedersachsen, BORIS.NI / LGLN, Datenlizenz Deutschland – Namensnennung 2.0.''')

post(typ='foto', bild='office-nandino-beratung-960.webp', fokus=0.3, ort='Trennung & Scheidung',
 titel='Gemeinsames Haus – welcher Wert gilt?', link='/immobilienbewertung-scheidung.html', knopf='Mehr erfahren',
 text='''Trennung mit gemeinsamer Immobilie? Für den Zugewinnausgleich, die Auszahlung des Partners oder einen Verkauf braucht es einen Wert, den beide Seiten nachvollziehen können.

Was wir in solchen Fällen tun:
• neutral bewerten – unabhängig davon, wer uns beauftragt
• den Bewertungsstichtag mit Ihnen oder Ihren Anwälten abstimmen
• Haus und Grundstück nach ImmoWertV herleiten und jeden Schritt dokumentieren
• das Ergebnis verständlich erklären

Gerade wenn die Stimmung angespannt ist, hilft eine sachliche Grundlage. Ob ein Kurzgutachten genügt oder ein ausführliches Verkehrswertgutachten nötig ist, besprechen wir im kostenlosen Erstgespräch.''')

post(typ='foto', bild='office-nandino-unterlagen-960.webp', fokus=0.35, ort='Checkliste',
 titel='Diese Unterlagen helfen bei der Bewertung', link='/checkliste-immobilienbewertung.html', knopf='Mehr erfahren',
 text='''Welche Unterlagen brauche ich für eine Immobilienbewertung? Für das erste Gespräch reichen Objektart, Ort und Anlass. Für das Gutachten helfen uns dann:

• Grundbuchauszug und Flurkarte
• Grundrisse, Schnitte und Wohnflächenberechnung
• Baujahr und, falls vorhanden, Baubeschreibung
• Nachweise über Modernisierungen (Dach, Fenster, Heizung)
• bei Wohnungen: Teilungserklärung, Protokolle, Wirtschaftsplan
• bei Vermietung: Mietverträge und Mieterliste

Fehlt etwas? Kein Problem – vieles lässt sich beschaffen, und wir sagen Ihnen, wo.

Unsere Checkliste zum Abhaken und Ausdrucken finden Sie auf unserer Website.''')

post(typ='foto', bild='office-team-auswertung-1440.webp', fokus=0.4, ort='Wedemark',
 titel='Was Modernisierungen wirklich bringen', link='/blog/haus-bewerten-wedemark-modernisierung.html', knopf='Mehr erfahren',
 text='''Haus in der Wedemark modernisiert – und jetzt mehr wert? Nicht jede Investition steigert den Verkehrswert im gleichen Maß.

Wir unterscheiden bei der Bewertung:
• Maßnahmen, die die Restnutzungsdauer verlängern – etwa neues Dach, neue Fenster oder Heizung
• Ausstattung, die vor allem dem eigenen Geschmack entspricht
• Arbeiten, die geplant, aber noch nicht ausgeführt sind

Damit das im Gutachten nachvollziehbar wird, helfen Rechnungen, Fotos und das Datum der Arbeiten.

Die Wedemark ist unser Heimatort: Von Mellendorf und Bissendorf bis Elze und Resse kennen wir die Ortsteile aus eigener Anschauung. Mehr dazu in unserem Ratgeber.''')

post(typ='info', ort='Begriffe einfach erklärt', titel='Verkehrswert, Angebotspreis, Kaufpreis',
 bloecke=[('Verkehrswert', '= Marktwert nach §194 BauGB, am Stichtag erzielbar'), ('Angebotspreis', 'Verkaufsstrategie, kann höher oder niedriger liegen'), ('Kaufpreis', 'Was am Ende tatsächlich gezahlt wird')],
 link='/blog/verkehrswert-vs-marktwert.html', knopf='Mehr erfahren',
 text='''Verkehrswert, Marktwert, Angebotspreis – drei Begriffe, die oft durcheinandergehen.

• Verkehrswert und Marktwert meinen rechtlich dasselbe: den Preis, der am Stichtag im gewöhnlichen Geschäftsverkehr erzielbar wäre (§194 BauGB).
• Der Angebotspreis ist eine Verkaufsstrategie – er kann höher oder niedriger liegen.
• Der Kaufpreis ist das, was am Ende tatsächlich gezahlt wird.

Warum das wichtig ist: Bei Erbschaft, Scheidung oder gegenüber dem Finanzamt geht es um den Verkehrswert. Beim Verkauf ist er die realistische Grundlage, bevor Sie einen Angebotspreis festlegen.

In unserem Ratgeber erklären wir den Unterschied ausführlich.''')

post(typ='daten', ort='Burgwedel', titel='Bodenrichtwerte Burgwedel 2026',
 zonen=zonen('burgwedel', ['Großburgwedel-Ort', 'Wettmar', 'Großburgwedel-Am Heisterholz', 'Fuhrberg', 'Kleinburgwedel', 'Engensen', 'Oldhorst']),
 link='/blog/bodenrichtwert-grossburgwedel-2026.html', knopf='Mehr erfahren',
 text='''Bodenrichtwerte Burgwedel 2026: von 470 €/m² in Großburgwedel-Ort bis 135 €/m² in Oldhorst. Wettmar liegt bei 320 €/m², Fuhrberg bei 260 €/m², Thönse und Kleinburgwedel bei 220 €/m² (BORIS.NI, Stichtag 01.01.2026).

Mehr als 300 €/m² Unterschied innerhalb einer Stadt – das zeigt, wie stark der Ortsteil den Grundstückswert prägt. Für den Verkehrswert Ihres Hauses kommen Baujahr, Zustand und Ausstattung hinzu.

Wir bewerten in allen Burgwedeler Ortsteilen persönlich vor Ort. Alle Zonen und was sie bedeuten, finden Sie in unserem Beitrag zu den Bodenrichtwerten in Großburgwedel.

Quelle: Gutachterausschüsse für Grundstückswerte Niedersachsen, BORIS.NI / LGLN, Datenlizenz Deutschland – Namensnennung 2.0.''')

post(typ='foto', bild='office-vito-beratung-960.webp', fokus=0.3, ort='Kosten',
 titel='Was kostet eine Immobilienbewertung?', link='/blog/was-kostet-immobilienbewertung-hannover.html', knopf='Mehr erfahren',
 text='''Was kostet eine Immobilienbewertung in Hannover? Die ehrliche Antwort: Es hängt vom Zweck ab.

• Erstgespräch: kostenlos und unverbindlich
• Kurzgutachten: ab 490 € – für Kauf, Verkauf oder eine private Entscheidung
• Ausführliches Verkehrswertgutachten nach §194 BauGB: Preis nach Objekt und Umfang – zum Beispiel für Erbschaft, Scheidung oder Gericht

Sie erhalten vorab ein Festpreisangebot.

Unser Tipp: Klären Sie zuerst, wofür Sie das Gutachten brauchen. Für eine Verkaufsentscheidung reicht oft ein Kurzgutachten – für Gericht oder Finanzamt meist nicht.

Alle Details zu Kosten und Umfang finden Sie in unserem Ratgeber.''')

post(typ='foto', bild='office-nandino-grundriss-960.webp', fokus=0.55, ort='Isernhagen',
 titel='Fachwerkhaus bewerten', link='/blog/fachwerkhaus-bewerten-isernhagen.html', knopf='Mehr erfahren',
 text='''Fachwerkhaus in Isernhagen bewerten? In den alten Bauerschaften stehen viele Fachwerkhäuser – und ihr Wert hängt stark von der Substanz ab.

Worauf wir achten:
• Zustand von Holzbalken, Schwellen und Ausfachungen
• Feuchtigkeit und frühere Sanierungen
• Denkmalschutz – in Niedersachsen gilt er kraft Gesetzes, nicht erst durch die Eintragung ins Verzeichnis
• Nebengebäude und Grundstücksgröße auf der Hofstelle

Ein Fachwerkhaus kann sehr begehrt sein – oder hohe Sanierungskosten verbergen. Mit unserem Hintergrund aus Bauingenieurwesen und Architektur bewerten wir beides nachvollziehbar.

Mehr in unserem Ratgeber zum Fachwerkhaus in Isernhagen.''')

post(typ='daten', ort='Wunstorf · Steinhude', titel='Bodenrichtwerte Wunstorf 2026',
 zonen=zonen('wunstorf', ['Steinhude-Ufer', 'Steinhude-Bleichenstr.', 'Luthe', 'Steinhude-Großenheidorn', 'Wunstorf-Stiftstr.', 'Wunstorf-West', 'Blumenau']),
 link='/immobilienbewertung-wunstorf.html', knopf='Mehr erfahren',
 text='''Bodenrichtwerte Wunstorf 2026: Am Ufer in Steinhude erreicht der Bodenrichtwert 800 €/m² – der höchste Wert in Wunstorf. In der Kernstadt liegen die meisten Zonen bei 280 bis 300 €/m², in Blumenau bei 200 €/m² (BORIS.NI, Stichtag 01.01.2026).

Für Eigentümer am Steinhuder Meer bedeutet das: Die genaue Lage – Seenähe, Zuschnitt, Zufahrt – kann den Grundstückswert stark verändern. Gleichzeitig zählen Gebäude, Zustand und Nutzung.

Wir bewerten Häuser und Grundstücke in Steinhude, Großenheidorn, Luthe, Kolenfeld und der Kernstadt mit eigener Besichtigung.

Quelle: Gutachterausschüsse für Grundstückswerte Niedersachsen, BORIS.NI / LGLN, Datenlizenz Deutschland – Namensnennung 2.0.''')

post(typ='foto', bild='office-nandino-pruefung-960.webp', fokus=0.62, ort='Isernhagen · Altwarmbüchen',
 titel='Eigentumswohnung bewerten', link='/blog/wohnung-bewerten-isernhagen-altwarmbuechen.html', knopf='Mehr erfahren',
 text='''Eigentumswohnung in Altwarmbüchen bewerten? Neben Lage, Größe und Ausstattung kommt es auf die Gemeinschaft an.

Drei Wertfaktoren, die Eigentümer oft unterschätzen:
• anstehende Sanierungen am Gemeinschaftseigentum – Dach, Fassade, Heizung
• die Höhe der Erhaltungsrücklage im Verhältnis zum Zustand des Gebäudes
• Sondernutzungsrechte, etwa an Garten, Stellplatz oder Terrasse

Bitte halten Sie Teilungserklärung, die letzten Protokolle der Eigentümerversammlung und den Wirtschaftsplan bereit. Damit können wir den Zustand des ganzen Hauses einschätzen.

Unseren Ratgeber zur Wohnungsbewertung in Isernhagen und Altwarmbüchen finden Sie auf unserer Website.''')

post(typ='foto', bild='hero-hannover-luftbild-quer-1600.webp', fokus=0.5, ort='Hannover',
 titel='Immobilienpreise 2026 richtig einordnen', link='/blog/immobilienpreise-hannover-2026.html', knopf='Mehr erfahren',
 text='''Was ist meine Immobilie in Hannover 2026 wert? Durchschnittspreise aus Portalen helfen bei der Orientierung – über Ihre Immobilie sagen sie wenig.

Warum?
• Angebotspreise in Portalen sind keine Verkaufspreise
• Stadtteile und sogar einzelne Straßen unterscheiden sich deutlich
• Baujahr, Zustand und Grundriss verändern den Wert stark
• bei Wohnungen kommt der Zustand des ganzen Hauses hinzu

Belastbarer sind die Daten der Gutachterausschüsse: Bodenrichtwerte und ausgewertete Kaufpreise. Wir verbinden sie mit dem, was wir bei der Besichtigung sehen.

In unserem Beitrag zu den Immobilienpreisen in Hannover 2026 ordnen wir die aktuellen Zahlen ein.''')

post(typ='daten', ort='Lehrte', titel='Bodenrichtwerte Lehrte 2026',
 zonen=zonen('lehrte', ['Lehrte-Villa-Nordstern', 'Lehrte-West/Süd', 'Ahlten', 'Lehrte-Nord', 'Steinwedel', 'Arpke', 'Lehrte-Nordwest']),
 link='/immobilienbewertung-lehrte.html', knopf='Mehr erfahren',
 text='''Bodenrichtwerte Lehrte 2026: Die Spanne reicht von 500 €/m² in der Zone Villa-Nordstern über 320 €/m² in Lehrte-West/Süd und 300 €/m² in Ahlten bis 165 €/m² in Lehrte-Nordwest (BORIS.NI, Stichtag 01.01.2026).

In Aligse, Immensen und Arpke liegt der Wert bei rund 180 €/m². Für Ihr Haus heißt das: Der Ortsteil prägt den Grundstückswert stark – den Verkehrswert bestimmen dann Gebäude, Zustand und Ausstattung.

Wir bewerten in Lehrte, Ahlten, Hämelerwald, Sievershausen, Arpke und allen weiteren Ortsteilen mit eigener Besichtigung.

Quelle: Gutachterausschüsse für Grundstückswerte Niedersachsen, BORIS.NI / LGLN, Datenlizenz Deutschland – Namensnennung 2.0.''')

post(typ='foto', bild='hero-hannover-rathaus-quer-1600.webp', fokus=0.45, ort='Hannover & Region',
 titel='Online-Rechner oder Gutachten?', link='/', knopf='Mehr erfahren',
 text='''Online-Rechner oder Gutachten? Ein Rechner liefert in zwei Minuten eine Zahl – aber er war nie in Ihrem Haus.

Was ein Online-Rechner nicht weiß:
• ob das Dach dicht ist oder der Keller feucht
• welche Modernisierungen wirklich gemacht wurden
• wie der Grundriss funktioniert und wie hell die Räume sind
• was in der Teilungserklärung Ihrer Wohnung steht

Für eine erste Orientierung kann ein Rechner reichen. Geht es um einen Verkauf, eine Erbschaft oder eine Trennung, sollte der Wert begründet sein.

Für das neue Jahr nehmen wir schon jetzt Termine an. Das Erstgespräch ist kostenlos – sprechen Sie uns an.''')

VERBOTEN = ['zertifiziert', 'öffentlich bestellt', 'ö.b.u.v', 'rechtssicher', 'Architekt ', 'garantiert', 'anerkannt wird', '0174', 'http']

if __name__ == '__main__':
    md = ['# 20 Beiträge für das Google-Unternehmensprofil', '',
          'Hochladen alle 3 Tage im Google-Unternehmensprofil → **Beitrag hinzufügen → Neuigkeiten**. '
          'Bild hochladen, Text einfügen, Schaltfläche und Link setzen. Keine Telefonnummer und keine Links in den Text – '
          'Google lehnt solche Beiträge häufig ab; dafür sind Schaltfläche und Link da.', '']
    karten = []
    for i, p in enumerate(P, 1):
        for w in VERBOTEN: assert w not in p['text'], (i, w)
        assert len(p['text']) <= 1500, (i, len(p['text']))
        im = {'foto': foto, 'daten': datenkarte, 'info': infokarte}[p['typ']](p)
        datum = START + datetime.timedelta(days=3 * (i - 1))
        name = f'{i:02d}_{datum.isoformat()}.jpg'
        im.save(os.path.join(OUT, name), quality=88, optimize=True)
        url = f"{SITE}{p['link']}?utm_source=google&utm_medium=gbp&utm_campaign=beitrag-{i:02d}"
        md += [f"## {i:02d} · {datum.strftime('%d.%m.%Y')} · {p['ort']}", '',
               f'**Bild:** `{name}`  ', f"**Schaltfläche:** {p['knopf']}  ", f'**Link:** {url}', '', p['text'], '', '---', '']
        karten.append((i, datum, name, p, url))
    open(os.path.join(OUT, 'beitraege.md'), 'w', encoding='utf-8').write('\n'.join(md))
    e = html.escape
    teile = []
    for i, datum, name, p, url in karten:
        teile.append(f'''<article><img src="{name}" alt="" loading="lazy"><div class="k">
<p class="m">{i:02d} · {datum.strftime('%a %d.%m.%Y').replace('Mon','Mo').replace('Tue','Di').replace('Wed','Mi').replace('Thu','Do').replace('Fri','Fr').replace('Sat','Sa').replace('Sun','So')} · {e(p['ort'])}</p>
<textarea readonly rows="12">{e(p['text'])}</textarea>
<p class="b"><button onclick="kopiere(this,0)">Text kopieren</button><button onclick="kopiere(this,1)" data-u="{e(url)}">Link kopieren</button><a href="{name}" download>Bild speichern</a></p>
<p class="u">Schaltfläche: {e(p['knopf'])} · {e(url)}</p></div></article>''')
    seite = f'''<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Google-Beiträge</title><style>
:root{{--navy:#16365C;--gold:#9C7A2E;--papier:#F6F4F0;--ink:#10243D;--muted:#55667B;--linie:#E2DCD1}}
body{{margin:0;background:var(--papier);color:var(--ink);font:16px/1.5 -apple-system,"Avenir Next",sans-serif}}
header{{background:var(--navy);color:#fff;padding:28px 16px}}header h1{{margin:0 auto;max-width:1100px;font-size:26px}}header p{{margin:6px auto 0;max-width:1100px;opacity:.85}}
main{{max-width:1100px;margin:0 auto;padding:16px}}article{{display:grid;grid-template-columns:minmax(0,460px) minmax(0,1fr);gap:20px;background:#fff;border-top:3px solid var(--navy);padding:16px;margin:0 0 20px}}
article img{{width:100%;height:auto;display:block}}.m{{margin:0 0 8px;font-weight:700;color:var(--gold)}}
textarea{{width:100%;box-sizing:border-box;font-family:inherit;font-size:14px;line-height:1.5;border:1px solid var(--linie);padding:10px;resize:vertical;color:var(--ink);background:#fff}}
.b{{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 4px}}button,.b a{{background:var(--navy);color:#fff;border:0;padding:9px 14px;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;text-decoration:none}}
.u{{font-size:12px;color:var(--muted);word-break:break-all;margin:0}}
@media(max-width:760px){{article{{grid-template-columns:1fr}}}}</style></head><body>
<header><h1>20 Google-Beiträge · alle 3 Tage</h1><p>Profil → Beitrag hinzufügen → Neuigkeiten. Bild speichern, Text kopieren, Schaltfläche „{e(P[0]['knopf'])}“ mit dem kopierten Link.</p></header>
<main>{''.join(teile)}</main>
<script>function kopiere(b,l){{var t=l?b.dataset.u:b.closest('.k').querySelector('textarea').value;navigator.clipboard.writeText(t).then(function(){{var a=b.textContent;b.textContent='Kopiert ✓';setTimeout(function(){{b.textContent=a}},1500)}})}}</script>
</body></html>'''
    open(os.path.join(OUT, 'uebersicht.html'), 'w', encoding='utf-8').write(seite)
    print(len(karten), 'Beiträge erzeugt in', OUT)
