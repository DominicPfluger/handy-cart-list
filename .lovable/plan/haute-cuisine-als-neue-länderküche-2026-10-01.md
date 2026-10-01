# Haute Cuisine als neue Länderküche

## Ziel
Neuer Eintrag **„Haute Cuisine“** (🍾) in den Länderküchen — nur hochwertige Luxusartikel und erlesene Delikatessen. Keine billigen Konserven; Ausnahmen nur für hochwertige Einlegeprodukte (Getrocknete Tomaten, Knoblauch in Öl, frische Oliven).

## Schritt 1: Küche anlegen (Datenbank)
- `cuisines`: neuer Eintrag „Haute Cuisine“, Emoji 🍾, `sort_order` 16 (ans Ende).
- Name in alle 15 Sprachen übersetzen und in `catalog_translations` (entity_type `cuisine`) eintragen, z. B. „Haute Cuisine“ (FR/EN), „Alta Cucina“ (IT), „Alta Cocina“ (ES), „Alta Cozinha“ (PT), „Haute Cuisine“ (NL).

## Schritt 2: Vorhandene Luxusartikel verknüpfen
Bereits im Katalog vorhanden — per `product_cuisines` zuordnen:
- **Meeresfrüchte:** Hummer, Langusten, Kaviar, Jakobsmuscheln, Scampi, Austern, Hummerschwänze (TK), Riesengarnelen (TK), Black-Tiger-Garnelen (TK)
- **Fleisch & Geflügel:** Rindsfilet, Rindsfilet-Medaillons, Kalbsfilet, Lammrückenfilet, Rehrückenfilet, Entenbrust, Gänseleber, Wachteln, Wachtelbrust, Wachtelfilet, Wachteleier, Hirschpastete, Lammterrine
- **Pilze & Trüffel:** Frische Trüffel, Steinpilze, Morcheln, Pfifferlinge, Trüffelöl, Trüffelbutter, Trüffelmayonnaise, Trüffel-Balsamico
- **Feinkost & Einlegeprodukte (erlaubte „Konserven“):** Getrocknete Tomaten, Grüne/Schwarze Oliven (frisch, Fruchtgemüse), Knoblauchöl, Artischocken in Öl, Anchovis in Öl, Artischockencreme
- **Weiteres:** Champagner, Champagner Rosé, Parmigiano Reggiano, Graved Lachs, Räucherlachs, Vanilleschoten, Balsamico (gereift), Weisser/Grüner Spargel

## Schritt 3: Fehlende Luxusartikel neu anlegen
Per Katalog-Abgleich fehlen noch (werden mit Emoji, Abteilung, Mengeneinheit und Übersetzungen in alle 15 Sprachen angelegt):
- **Safran** 🌸 (Gewürze)
- **Wagyu-Rindsfilet** 🥩 (Rind)
- **Knoblauch in Öl** 🧄 (Antipasti)
- **Trüffelpaste** 🍄 (Pikante Brotaufstriche)
- **Gänseleberpastete (Foie Gras)** 🦆 (Pikante Brotaufstriche)
- **Weinbergschnecken (Escargots)** 🐌 (Meeresfrüchte/Feinkost)
- **Kaviar-Ersatz (Rogen)** bleibt weg — nur echte Luxusartikel

Neue Produkte werden ebenfalls mit „Haute Cuisine“ verknüpft.

## Technisch
- Alle Änderungen sind Datenänderungen (kein Schema): Ausführung per `run_sql` (INSERT in `cuisines`, `products`, `catalog_translations`, `product_cuisines`).
- Übersetzungen liefere ich direkt mit (alle 15 Sprachvarianten, de-CH ohne ß).
- Keine Code-Änderungen nötig — der Küchen-Filter und das Admin-Panel lesen `cuisines`/`product_cuisines` bereits dynamisch.
- Danach in der Vorschau prüfen: Filter „Haute Cuisine“ zeigt nur die kuratierten Artikel.
