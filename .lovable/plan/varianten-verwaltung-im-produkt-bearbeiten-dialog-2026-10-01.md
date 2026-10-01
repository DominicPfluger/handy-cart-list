# Varianten-Verwaltung im Produkt-Bearbeiten-Dialog

## Ziel
Im Admin-Panel können beim Bearbeiten eines Produkts **Varianten manuell eingegeben** werden (z. B. „Vollmilch", „Rahm", „laktosefrei" bei Milch). Diese Varianten erscheinen bereits beim Hinzufügen zur Einkaufsliste zur Auswahl — neu ist die Verwaltung im Admin-Panel.

## Was gebaut wird

### Neuer Bereich „Varianten" im Produkt-Dialog
- Unterhalb der Ernährungsformen erscheint bei Produkten der Abschnitt **„Varianten"**.
- **Bestehende Varianten** werden als schlichte **Liste untereinander** angezeigt (eine Variante pro Zeile), jede Zeile mit einem **✕ zum Entfernen** (wirksam beim Speichern) — keine Chips.
- **Manuelle Eingabe:** Freies Textfeld mit **„+"-Button**; Enter im Feld fügt ebenfalls hinzu. Doppelte Einträge (Groß-/Kleinschreibung ignoriert) werden abgelehnt. Kein automatisches Vorschlagen von Varianten.
- **Häufige Varianten:** Zusätzlich eine Reihe antippbarer **Vorschlags-Chips** mit gängigen Varianten (z. B. „Bio", „Vollkorn", „laktosefrei", „zuckerfrei", „groß", „klein") — ein Tipp fügt sie der Liste hinzu; bereits vorhandene werden dort ausgeblendet.
- Die Liste wird beim **Speichern** zusammen mit den übrigen Feldern in `products.variants` gespeichert und gilt sofort für alle Nutzer.
- Hinweistext: „Varianten erscheinen beim Hinzufügen zur Einkaufsliste zur Auswahl."

## Technische Details
- Datei: `src/routes/_authenticated/admin.tsx`
- Produkt-Ladeabfrage um `variants` erweitern; `Prod`-Typ ergänzen
- `Patch`-Typ um `variants?: string[]` erweitern; Speicher-Handler schreibt `products.variants`
- `EditSheet`: neuer State `variants` (aus `prod.variants`), Chip-Liste, Eingabefeld und Vorschlags-Chips nur bei `sel.kind === "product"`
- Neue i18n-Keys (`adm.variants`, `adm.variantsHint`, `adm.variantPlaceholder`, `adm.variantCommon`) in `src/i18n/de.ts` und allen 15 Locales in `messages.json`
- Keine Datenbank-Änderung nötig — die Spalte `products.variants` existiert bereits
