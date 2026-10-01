# Kategorie-Bezeichnungen in Kategorienfarbe (dunkler & satter)

## Ziel
In der Abteilungsansicht (`/abteilungen`) sollen die Kategorien-Bezeichnungen unter den Kacheln dieselbe Farbe tragen wie der Vorschau-Bild-Container darüber — aber dunkler und gesättigter, damit sie auf dem weissen Karten-Hintergrund gut lesbar sind.

## Umsetzung

### 1. `src/styles.css` — 20 Text-Tokens ergänzen
Unterhalb der bestehenden 20 `--cat-*`-Flächenfarben jeweils ein dunkleres, satteres Pendant als `--cat-*-text` definieren (gleiche Namensbasis). Beispiele:

| Kategorie | Fläche (bestehend) | Text (neu) |
|---|---|---|
| frischmarkt | #EDF8EF | #3E8E52 |
| milch | #FAF7F1 | #9C7A3F |
| fleisch | #FBEEEC | #C05A4E |
| deli | #FEF5EC | #C77A3A |
| backwaren | #FCF7E8 | #B08A2E |
| vorraete | #F9F2E3 | #A67B2E |
| kochzutaten | #FAEFE9 | #B96A4C |
| tiefkuehl | #ECF5FA | #3D7FA6 |
| getraenke | #EAF7F5 | #2E8A80 |
| snacks | #FCF2E8 | #C07836 |
| suess | #FCEEF4 | #C4549A |
| koerperpflege | #F4F1FA | #7A5FC0 |
| haushalt | #EEF7F9 | #3D8FA3 |
| apotheke | #F0F7F2 | #4E8A5E |
| tierbedarf | #F7F1E9 | #9A6B3F |
| buero | #F0F3F7 | #5A6B85 |
| tabak | #F3F0ED | #7A6A55 |
| kleidung | #EFF3FA | #4A6BB0 |
| kuechenutensilien | #F8F0EB | #A56A45 |
| auto | #F1F2F4 | #4A4F5A |

Alle Werte sind auf gute Lesbarkeit auf Weiss abgestimmt (Kontrast) und bleiben im gleichen Farbton wie die Fläche.

### 2. `src/lib/dept-colors.ts` — Textfarbe parallel zur Flächenfarbe
- Neuer Map `ROOT_TEXT_COLORS` mit denselben 20 Schlüsseln → `var(--cat-*-text)`.
- Neue Funktion `deptColorText(department, byId): string | undefined`, analog zu `deptColor` (Wurzelkategorie erben, `undefined` als Fallback).
- `LABEL_COLORS`-Fallback ebenfalls um Textfarben ergänzen (neue Map bzw. Funktion `deptColorTextByLabel`).

### 3. `src/routes/abteilungen.tsx` — Farbe auf die Bezeichnung anwenden
- Zeile ~548: zusätzlich `const tileTextColor = deptColorText(department, deptById);`
- Zeile ~573 (Label-Span): `text-foreground` entfernen und stattdessen `style={{ color: tileTextColor }}` setzen; ohne Farbe (unbekannte Kategorie) bleibt der bisherige `text-foreground` als Fallback.

## Nicht im Umfang
- Einkaufslisten-Gruppen-Icons, Favoriten, Admin-Bereich, dunkler Modus (Flächenfarben bleiben unverändert).
- Nutzer-Farbauswahl.

## Verifikation
- Build-Log prüfen.
- Playwright: `/abteilungen` öffnen, Kacheln ansehen — Bezeichnungen tragen je Kategorie die dunklere Version der Flaschenfarbe (Screenshot).
