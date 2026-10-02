# Preise schätzen: Mehrere Märkte gleichzeitig auswählen

## Ziel
Im Admin-Panel unter „Preise" soll bei der Richtpreis-Schätzung nicht nur ein Markt, sondern beliebig viele Märkte gleichzeitig ausgewählt werden können. Die Schätzung läuft dann nacheinander für alle gewählten Märkte.

## Was sich ändert

### Markt-Auswahl (oben im Preise-Bereich)
- Die Markt-Kacheln (Flagge + Kürzel + Anzahl) werden zu Mehrfachauswahl: Antippen schaltet einen Markt an/aus, mehrere können gleichzeitig aktiv sein (blauer Rahmen wie heute).
- Mindestens ein Markt bleibt immer gewählt (der letzte lässt sich nicht abwählen).
- Voreinstellung bleibt der Markt der eigenen Sprache/Region.

### „Preise schätzen" (ganzer Katalog, 50er-Blöcke)
- Läuft nacheinander für jeden gewählten Markt.
- Der Fortschritt zeigt den aktuellen Markt an (z. B. „CH · 3 von 5 Märkten").
- Am Ende erscheint eine Gesamt-Zusammenfassung (z. B. „Fertig: 148 Preise in 3 Märkten").

### „Preise einer Kategorie schätzen" (aufklappbare Kategorieliste)
- Der Bestätigungsdialog nennt die Kategorie und alle gewählten Märkte (z. B. „Gemüse — CH, DE, AT").
- Nach Bestätigung läuft die Schätzung pro Markt nacheinander; die Abschlussmeldung fasst alle Märkte zusammen.

### Status-Anzeige
- Die Zeile „X Produkte mit Preis" bezieht sich auf den zuerst gewählten Markt (unverändert pro Markt, da die Statistik marktbezogen ist).
- Die aufklappbare Preisliste pro Markt darunter bleibt wie sie ist.

## Technische Umsetzung
- `src/components/admin/catalog-media-panel.tsx`:
  - State `market: string` wird zu `markets: Set<string>` mit Toggle-Logik (min. 1 gewählt).
  - `runPrices` und `runCategoryPrices` schleifen über die gewählten Märkte und rufen die bestehenden Server-Funktionen (`generateReferencePrices`, `estimateCategoryPrices`) pro Markt auf — keine Änderung am Backend nötig.
  - Status-Abfrage nutzt den ersten gewählten Markt.
- i18n: bestehende Texte `price.catConfirm`, `price.catDone`, `media.priceDone` erhalten Mehrmarkt-Varianten; neue Texte in `src/i18n/de.ts` und allen 15 weiteren Sprachen (`messages.json`).

## Bewusst nicht enthalten
- Keine parallele Schätzung (nacheinander schont Credits und vermeidet Fehler).
- Keine Änderung an gespeicherten Preisen oder am Datenbankschema.
