# Texthintergrund der Kategorie-Bezeichnungen einfärben

## Ziel
In der Abteilungsansicht bekommt der untere Bereich jeder Kachel, also der mit dem Kategorienamen, einen eigenen Hintergrund. Er hat denselben Farbton wie der Bildbereich darüber, ist aber etwas dunkler und satter. Die Schrift bleibt schwarz (bzw. in der normalen Textfarbe).

## Umsetzung

### 1. `src/styles.css`: 20 neue Farbwerte
Neben jeder bestehenden `--cat-*`-Farbe gibt es ein dunkleres, satteres Gegenstück `--cat-*-strong`. Es soll nur eine Stufe kräftiger sein, damit schwarze Schrift gut lesbar bleibt. Beispiele:

| Kategorie | Bildbereich (bisher) | Textbereich (neu) |
|---|---|---|
| frischmarkt | #EDF8EF | #D3EFD9 |
| milch | #FAF7F1 | #F1E8D3 |
| fleisch | #FBEEEC | #F6D6D0 |
| deli | #FEF5EC | #FCE2C9 |
| backwaren | #FCF7E8 | #F7EAC2 |
| vorraete | #F9F2E3 | #F1E1BE |
| kochzutaten | #FAEFE9 | #F3D8CA |
| tiefkuehl | #ECF5FA | #CFE5F3 |
| getraenke | #EAF7F5 | #CAEDE7 |
| snacks | #FCF2E8 | #F8DEC4 |
| suess | #FCEEF4 | #F7D3E4 |
| koerperpflege | #F4F1FA | #E3DBF4 |
| haushalt | #EEF7F9 | #CFEAF0 |
| apotheke | #F0F7F2 | #D5EBDC |
| tierbedarf | #F7F1E9 | #ECDCC6 |
| buero | #F0F3F7 | #D8E0EB |
| tabak | #F3F0ED | #E3DCD4 |
| kleidung | #EFF3FA | #D4E0F4 |
| kuechenutensilien | #F8F0EB | #EED9CC |
| auto | #F1F2F4 | #DCDFE4 |

### 2. `src/lib/dept-colors.ts`
Neue Funktion `deptColorStrong(department, byId)`, die analog zu `deptColor` arbeitet: Sie gibt `var(--cat-*-strong)` der Wurzelkategorie zurück, für unbekannte Kategorien `undefined`.

### 3. `src/routes/abteilungen.tsx`
Der Bereich mit dem Kategorienamen (ca. Zeile 572) erhält `style={{ backgroundColor: deptColorStrong(...) }}`. Die Schrift behält `text-foreground`. Ohne Farbe bleibt alles wie bisher.

## Nicht im Umfang
Schriftfarbe, Bildbereich, Einkaufsliste, Favoriten und Dunkelmodus.

## Prüfung
Build prüfen und einen Screenshot von `/abteilungen` machen: farbiger Textbereich, schwarze Schrift.
