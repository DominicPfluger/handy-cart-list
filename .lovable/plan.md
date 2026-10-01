# Lieblingsmengen auf der Produkt-Detailseite

## Ziel
Auf der Produkt-Detailseite kannst du pro Produkt deine bevorzugte Menge (Anzahl + Einheit) speichern. Diese Lieblingsmenge wird beim Hinzufügen zur Einkaufsliste automatisch vorgeschlagen.

## Umsetzung

### 1. Speicherung (geräte-lokal)
- Lieblingsmengen sind persönliche Einstellungen und werden wie die übrigen persönlichen Daten (Favoriten, versteckte Artikel) nur auf deinem Gerät gespeichert — nicht in der Datenbank, damit der gemeinsame Katalog unverändert bleibt.
- Neuer Speicher-Schlüssel `shoppi:product-quantities` in `localStorage`: pro Produkt-ID eine Menge + Einheit.
- Neuer kleiner Hook `src/hooks/use-favorite-quantity.ts` mit Lesen, Speichern und Löschen pro Produkt.

### 2. Produkt-Detailseite (`src/routes/produkt.$id.tsx`)
- Neuer Abschnitt „Meine Lieblingsmenge" unter den Produktdetails:
  - Zahlenfeld für die Menge und Auswahl der Einheit (alle 33 Einheiten).
  - Knopf „Als Lieblingsmenge speichern".
  - Ist bereits eine Lieblingsmenge gespeichert, wird sie angezeigt und kann überschrieben oder mit „Zurücksetzen" gelöscht werden.
  - Kurze Bestätigung per Toast nach dem Speichern.
- Der Abschnitt ist für alle Nutzer sichtbar (nicht nur Admins), weil es eine persönliche Einstellung ist.

### 3. Vorschlag beim Hinzufügen (`src/components/catalog-product-dialog.tsx`)
- Beim Öffnen des „Zur Liste hinzufügen"-Dialogs wird — falls vorhanden — die gespeicherte Lieblingsmenge statt der Standard-Menge vorausgefüllt (Menge + Einheit).
- Ohne Lieblingsmenge bleibt alles wie bisher (Standard-Menge des Produkts).

### 4. Übersetzungen
- Neue Texte (`pd.favQuantity`, `pd.saveFavQuantity`, `pd.resetFavQuantity`, `pd.favQuantitySaved`) in `src/i18n/de.ts` und allen 15 Sprachen in `messages.json`.

## Technische Details
- Kein Datenbank-Schema nötig (keine Migration).
- Betroffene Dateien: `src/hooks/use-favorite-quantity.ts` (neu), `src/routes/produkt.$id.tsx`, `src/components/catalog-product-dialog.tsx`, `src/i18n/de.ts`, `src/i18n/messages.json`.
- Einheiten kommen aus `getUnits(locale)` (33 Einheiten, bereits übersetzt).
- Verifikation: Build-Log prüfen, dann in der Vorschau eine Lieblingsmenge speichern und prüfen, ob der Hinzufügen-Dialog sie vorausfüllt.
