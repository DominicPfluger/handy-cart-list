# Varianten-Verwaltung im Produkt-Bearbeiten-Dialog

## Ziel
Im Admin-Panel können beim Bearbeiten eines Produkts **Varianten** gepflegt werden (z. B. „Vollmilch", „Rahm", „laktosefrei" bei Milch). Diese Varianten erscheinen bereits beim Hinzufügen zur Einkaufsliste zur Auswahl — neu ist die Verwaltung im Admin-Panel.

## Was gebaut wird

### Neuer Bereich „Varianten" im Produkt-Dialog
- Unterhalb der Ernährungsformen erscheint bei Produkten der Abschnitt **„Varianten"**.
- **Bestehende Varianten** werden als Chips angezeigt, jede mit einem **✕ zum Entfernen** (sofort wirksam beim Speichern).
- **Neues Textfeld + „+"-Button** zum Hinzufügen einer Variante; Enter im Feld fügt ebenfalls hinzu. Doppelte Einträge (Groß-/Kleinschreibung ignoriert) werden abgelehnt.
- Die Liste wird beim **Speichern** zusammen mit den übrigen Feldern in `products.variants` gespeichert und gilt sofort für alle Nutzer.
- Hinweistext: „Varianten erscheinen beim Hinzufügen zur Einkaufsliste zur Auswahl."

## Technische Details
- Datei: `src/routes/_authenticated/admin.tsx`
- Produkt-Ladeabfrage um `variants` erweitern; `Prod`-Typ ergänzen
- `Patch`-Typ um `variants?: string[]` erweitern; Speicher-Handler schreibt `products.variants`
- `EditSheet`: neuer State `variants` (aus `prod.variants`), Chip-Liste + Eingabefeld nur bei `sel.kind === "product"`
- Neue i18n-Keys (`adm.variants`, `adm.variantsHint`, `adm.variantPlaceholder`) in `src/i18n/de.ts` und allen 15 Locales in `messages.json`
- Keine Datenbank-Änderung nötig — die Spalte `products.variants` existiert bereits
