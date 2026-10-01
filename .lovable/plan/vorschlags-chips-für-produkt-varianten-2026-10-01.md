# Vorschlags-Chips für Produkt-Varianten

## Ziel
Im Produkt-Bearbeiten-Dialog (Admin) gibt es zusätzlich zum manuellen Eingabefeld vordefinierte Vorschlags-Chips (Bio, Vollkorn, laktosefrei, glutenfrei, zuckerfrei, light, groß, klein, mild, scharf). Ein Tipp auf einen Chip fügt die Variante nur diesem einen Produkt hinzu — sie wird nicht global gespeichert und erscheint nicht automatisch bei anderen Produkten.

## Umsetzung
- `src/routes/_authenticated/admin.tsx`:
  - Konstante `COMMON_VARIANTS` mit den 10 Standard-Vorschlägen wieder einführen.
  - Im Varianten-Bereich des Dialogs: Chips-Zeile unterhalb des bestehenden Eingabefelds (Eingabefeld bleibt separat und unverändert).
  - Tipp auf einen Chip ruft `addVariant(chip)` auf — die Variante landet in der lokalen Liste und wird erst bei „Speichern" in `products.variants` geschrieben.
  - Bereits hinzugefügte Chips werden deaktiviert/abgehakt dargestellt, damit klar ist, welche Vorschläge schon vergeben sind.
- Hinweistext `adm.variantsHint` bleibt: Varianten gelten nur für dieses Produkt.

## Keine Änderungen an
- Datenbank / Speicherlogik (Varianten bleiben produktbezogen, kein globales Vorschlags-Register).
- Manuellem Eingabefeld und Bestandesliste mit ✕ zum Entfernen.
