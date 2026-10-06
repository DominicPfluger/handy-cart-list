# Gleiche Artikel immer zusammenführen statt doppelt eintragen

## Heute
Eine Zusammenführung existiert schon, greift aber nur in engen Fällen. Doppelte Einträge entstehen, wenn:
- die Menge Text enthält (z. B. „1 Stück", „500 g") statt nur einer Zahl,
- die Einheiten unterschiedlich, aber umrechenbar sind (g/kg, ml/l),
- ein Artikel frei eingetippt wird (Texteingabe, Scanner, Rezept-Zutaten „beliebig"),
- mehrere Artikel kurz hintereinander hinzugefügt werden (Rezept übernehmen, Mehrfachauswahl): die zweite Hinzufügung sieht den ersten Eintrag noch nicht,
- der vorhandene Eintrag eine Notiz hat.

## Neu
- Gleiches Produkt (bzw. gleicher Name), gleiche Bio-Angabe, nicht abgehakt → Menge wird addiert, Hinweis „zusammengeführt" wie bisher.
- Mengen wie „2 Stück", „1,5 kg" werden erkannt.
- Umrechenbare Einheiten werden addiert und in der Einheit des vorhandenen Eintrags angezeigt (500 g + 1 kg → 1500 g).
- Nicht umrechenbare Einheiten (z. B. Stück + Packung) bleiben getrennte Einträge.
- Notiz am vorhandenen Eintrag bleibt erhalten; nur ein neuer Eintrag mit eigener Notiz oder Foto wird separat angelegt.
- Abgehakte Einträge werden nicht angefasst (neuer offener Eintrag).
- Gilt für alle Wege: Abteilungen, Favoriten, Produktdialog, Rezept-Generator, Rezeptseite, Scanner, freie Eingabe – in lokalen und geteilten Listen.

## Technische Details
- `findMergeTarget` in `src/hooks/use-shopping-list.ts`: `parseAmount` aus `src/lib/item-price.ts` nutzen; Einheiten über gemeinsame Skala (`UNIT_SCALE` exportieren) vergleichen und umrechnen; `!it.note`-Bedingung entfernen.
- Merge auch in `addItem` (Freitext) und `localAddItem` anwenden.
- Stale-State beim Mehrfach-Hinzufügen: Ref mit aktuellen Items der aktiven Liste, die bei jedem Add/Merge sofort aktualisiert wird; Merge-Suche liest diese Ref. Merge auf `tmp-`-Einträgen aktualisiert lokal und wird nach Speichern nachgesendet (bestehender Mechanismus für ausstehende Änderungen).
- Prüfung im Browser: gleiches Produkt zweimal, „1 kg" + „500 g", Rezept mit doppelter Zutat → je ein Eintrag mit Summe.
