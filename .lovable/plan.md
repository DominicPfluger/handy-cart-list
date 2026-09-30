# Kategorie-Bilder zuweisen (Tiefkühl & Eiscreme)

## Ziel
Die 9 hochgeladenen Bilder den passenden Kategorien zuweisen.

## Zuordnung (eindeutig anhand Dateinamen)
- `tk-produkte.webp` → **Tiefkühlprodukte** (Abteilung)
- `tk-beilagen.webp` → **TK-Beilagen**
- `tk-gemüse.webp` → **TK-Gemüse**
- `eiscreme.webp` → **Eiscreme**
- `frozen-joghurt.webp` → **Frozen Yoghurt**
- `sahneeis.webp` → **Sahne-Eiscreme** (ersetzt bestehendes Bild)
- `sorbet.webp` → **Sorbet** (ersetzt bestehendes Bild)
- `stieleis.webp` → neue Unterkategorie **Stieleis** unter Eiscreme anlegen (existiert noch nicht)

## Offener Punkt: tk-fertiggerichte.webp
Es gibt keine Kategorie „Fertiggerichte". Vorschlag: neue Unterkategorie **TK-Fertiggerichte** unter **Tiefkühlprodukte** anlegen und das Bild dort zuweisen. (Alternative: Bild nicht verwenden.)

## Technisches Vorgehen
1. Bilder aus `/mnt/user-uploads/` in den bestehenden Storage-Bucket `catalog-images` hochladen (Pfadschema `departments/<name>.webp`, wie bei den vorhandenen Bildern).
2. `image_path` der betroffenen `departments`-Zeilen per SQL setzen.
3. Neue Kategorien (Stieleis, ggf. TK-Fertiggerichte) anlegen: passende `sort_order`, Emoji, Übersetzungen für alle 15 Nicht-de-DE-Locales in `catalog_translations` (de-AT/de-CH = deutscher Basisname).
4. Sichtprüfung in der Abteilungsansicht.
