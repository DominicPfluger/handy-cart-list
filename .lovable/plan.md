# Varianten nur produktspezifisch speichern

## Ziel

Produkt-Varianten, die im Admin-Panel bei einem Produkt eingetragen werden, gehören ausschliesslich zu diesem Produkt. Sie dürfen bei anderen oder neu erstellten Produkten nicht als Vorschlag erscheinen. Gespeichert wird weiterhin nur beim Tippen auf „Speichern“.

## Umsetzung

1. **Vorschlags-Chips entfernen** (`src/routes/_authenticated/admin.tsx`)
   - Die Liste häufiger Varianten (Bio, Vollkorn, laktosefrei, glutenfrei, zuckerfrei, light, gross, klein, mild, scharf) wird aus dem Produkt-Bearbeiten-Dialog entfernt.
   - Damit erscheinen weder bei neuen noch bei bestehenden Produkten fremde Varianten als Schnellauswahl.

2. **Varianten-Eingabe bleibt manuell pro Produkt**
   - Eingabefeld + „+“-Knopf und die Liste bestehender Varianten (mit ✕ zum Entfernen) bleiben unverändert.
   - Varianten werden nur in der Datenbank-Spalte `products.variants` des jeweiligen Produkts gespeichert — ausschliesslich beim Tippen auf „Speichern“. Kein automatisches Speichern, kein gemeinsamer Varianten-Pool.

3. **Hinweistext anpassen**
   - Der Hinweis unter dem Varianten-Bereich wird klargestellt: Varianten gelten nur für dieses Produkt.

## Technische Details

- Betroffene Datei: `src/routes/_authenticated/admin.tsx` (Editor-Komponente, Konstante `COMMON_VARIANTS` und deren Rendering entfernen).
- Übersetzung: angepasster Hinweistext in `src/i18n/de.ts` + `messages.json` (alle 16 Sprachvarianten, de-CH ß→ss).
- Keine Datenbank-Änderung nötig — `products.variants` ist bereits produktspezifisch.

## Prüfung

- Build/Typecheck fehlerfrei.
- Vorschau: Produkt-Dialog öffnen — keine Vorschlags-Chips mehr; Variante eintragen, speichern, bei einem anderen Produkt prüfen, dass sie dort nicht erscheint.
