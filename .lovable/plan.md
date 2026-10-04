# Preise pro Kategorie schätzen + Produktliste pro Unterkategorie

## Ziel
Im Admin-Panel unter „Preise" gibt es bereits die Kategorie-Schätzung („Preise schätzen" pro Kategorie). Neu: Ein Klick auf eine (Unter-)Kategorie klappt deren Produkte auf und zeigt sie mit Preis-Status an.

## Umsetzung

### 1. Aufklappbare Produktliste pro Kategorie (`catalog-media-panel.tsx`)
- Jede Kategorie-Zeile (auch Unterkategorien ohne eigene Kinder) wird klickbar: Tipp auf den Namen klappt die Produktliste dieser Kategorie auf/zu (Chevron-Pfeil wie bisher bei Kategorien mit Kindern; bei Blatt-Kategorien erscheint ebenfalls ein Pfeil, sobald Produkte vorhanden sind).
- Aufgeklappt erscheinen die Produkte der Kategorie (inkl. Unterkategorien, in Baumreihenfolge), jeweils mit:
  - kleinem Icon (icon_path, sonst Emoji),
  - Name,
  - Preis-Status für die gewählten Märkte: vorhandener Richtpreis (z. B. „CHF 2.40") oder „–" wenn keiner existiert,
  - Knopf „Schätzen" pro Produkt (nutzt die bestehende Einzelschätzung `estimateProductPrice` und speichert sie),
  - Stift-Knopf, der den bestehenden Produkt-Bearbeitungsdialog öffnet (`onEdit`).
- Pro Kategorie werden zunächst 20 Produkte geladen, mit „Weitere laden" (Ressourcen schonen).

### 2. Server-Funktion erweitern (`product-media.functions.ts`)
- `listReferencePrices` erhält optionalen Filter `departmentId`: liefert Produkte dieser Kategorie inkl. aller Unterkategorien (rekursiv, wie bei `estimateCategoryPrices`), auch solche ohne Preis (Left-Join statt Inner-Join), seitenweise.
- Rückgabe ergänzt `product_id`, damit Schätzen/Bearbeiten direkt verdrahtet ist.

### 3. Texte
- Neue i18n-Schlüssel (z. B. `price.catProducts`, `price.loadMore`, `price.estimateOne`) in allen 16 Sprachen.

## Technische Details
- Dateien: `src/components/admin/catalog-media-panel.tsx`, `src/lib/product-media.functions.ts`, `src/i18n/de.ts` + `messages.json`.
- Keine DB-Änderungen, keine neuen Tabellen.
- Verhalten der bestehenden „Preise schätzen"-Kategorie-Knöpfe bleibt unverändert.

## Prüfung
- Typprüfung (`bunx tsgo --noEmit`) und Build-Log.
- Browser-Test als Admin: Preise-Tab öffnen, Unterkategorie anklicken, Produktliste mit Preisen prüfen, Einzelschätzung und Bearbeiten-Dialog testen.
