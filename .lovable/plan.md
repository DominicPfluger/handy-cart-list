# Preisschätz-Knopf in der Admin-Produktliste

## Ziel
In der Produktauflistung des Admin-Panels (Kachel-Editor) bekommt jede Produktzeile einen zusätzlichen Knopf mit Preisschild-Symbol. Er öffnet den bestehenden „Produkt bearbeiten"-Dialog direkt beim Preisbereich (manuelle Marktpreise + KI-Schätzung), sodass der Admin nicht erst durch den Dialog scrollen muss.

## Umsetzung
- `src/components/admin/catalog-tile-editor.tsx`
  - Neuer Icon-Knopf (Tag/Banknote-Symbol) in der Produktzeile, neben Stift und Papierkorb — nur im Bearbeiten-Modus sichtbar; bei Alias-Zeilen wirkt er auf das Stammprodukt (wie der Varianten-Knopf).
  - Klick öffnet denselben Bearbeiten-Dialog wie der Stift (`onAdvanced("product", id)`), zusätzlich wird der Preisbereich (manuelle Marktpreise, `mpOpen`) automatisch aufgeklappt und angescrollt.
  - Dazu bekommt der Dialog eine optionale Anfangs-Einstellung (z. B. `initialSection: "prices"`), die `mpOpen` auf `true` setzt und per `ref.scrollIntoView()` zum Preisbereich springt.
- Keine Änderung an Server-Funktionen: Die vorhandene KI-Schätzung (`estimateProductPricesAllMarkets` / `estimateProductPrice`) und deren Bestätigungsfragen bleiben unverändert.

## Übersetzungen
- Neuer i18n-Schlüssel `adm.estimatePrice` = „Preis schätzen" (Tooltip/aria-label) in allen 16 Sprachen (de.ts + messages.json).

## Prüfung
- Typprüfung und Build.
- Browser-Test: Admin-Panel öffnen, Knopf in einer Produktzeile klicken, prüfen, dass der Dialog geöffnet und der Preisbereich sichtbar ist.
- roadmap.md ergänzen.
