# Kategorie «Zucker & Süssmittel» unter Backzutaten

## Ausgangslage (geprüft)
- **Backzutaten** liegt unter Kochzutaten (Backen-Bereich) und enthält bisher nur die Unterkategorien **Mehl** und **Backmischungen** (keine direkten Artikel).
- Keine der 11 gewünschten Bezeichnungen existiert bereits im Katalog — keine Duplikate.

## Was umgesetzt wird

**1. Neue Unterkategorie «Zucker & Süssmittel» unter Backzutaten**
- Position: nach Backmischungen (letzte Stelle, Reihenfolge 3).

**2. Die 11 Artikel in der angegebenen Reihenfolge:**

| # | Artikel | Menge | Hinweis Diät-Filter |
|---|---|---|---|
| 1 | Kristallzucker | 1 kg | fällt bei Zuckerfrei/Keto/Low-Carb weg |
| 2 | Rohrzucker | 1 kg | ebenso |
| 3 | Vollrohrzucker | 1 kg | ebenso |
| 4 | Puderzucker | 1 Packung | ebenso |
| 5 | Kandiszucker | 1 Packung | ebenso |
| 6 | Agavendicksaft | 1 Flasche | ebenso |
| 7 | Ahornsirup | 1 Flasche | ebenso |
| 8 | Stevia | 1 Packung | bleibt bei allen Ernährungsformen sichtbar |
| 9 | Yacon-Sirup | 1 Flasche | bleibt bei allen sichtbar |
| 10 | Xanthan | 1 Packung | Bindemittel — bleibt bei allen sichtbar |
| 11 | Zuckerrübensirup | 1 Glas | fällt bei Zuckerfrei/Keto/Low-Carb weg |

**3. Übersetzungen:** alle Namen in 6 Sprachen (en-US, es-ES, fr-FR, it-IT, nl-NL, pt-BR), wie bei allen bisherigen Katalogergänzungen. Nach einem Neuladen (ca. 30 Sekunden Cache) sichtbar.

## Technische Details
- Tabellen: `departments` (neue Unterkategorie) und `products` (11 Artikel) via Migration + Datenbank-Insert; Übersetzungen in `catalog_translations` (`is_manual=true`, deutsche Namen nur in `departments.name`/`products.name`).
- Neue IDs im bisherigen Schema: Unterkategorie `a1b2c3d4-2b00-…`, Artikel `a1b2c3d4-2b01…2b0b`.
- `excluded_diets`: `{sugar_free, keto, low_carb}` für Zucker/Sirups (inkl. Zuckerrübensirup), leer für Stevia, Yacon-Sirup und Xanthan.
- Keine Änderung am App-Code nötig — Katalog kommt aus der Datenbank.
