# KI-Variantenvorschläge im Produkt-Bearbeiten-Dialog

## Ziel
Im Produkt-Bearbeiten-Dialog (Admin, Stift-Symbol) kann man sich im Abschnitt „Varianten" Vorschläge per KI erzeugen lassen — dieselbe Funktion, die bereits im Schnell-Dialog (Etiketten-Symbol) existiert.

## Umsetzung (`src/routes/_authenticated/admin.tsx`)

1. **Knopf im Varianten-Abschnitt des EditSheet**: „✨ Varianten per KI vorschlagen" (bestehender i18n-Schlüssel `adm.variantSuggest`), nur bei `sel.kind === "product"`.
2. **Bestätigungs-Overlay**: Credits-Hinweis (`adm.variantSuggestConfirm`) + Anzahl-Auswahl 5 / 10 / 15 (Voreinstellung 10, Label `adm.suggestCount`).
3. **Aufruf**: bestehende Server-Funktion `suggestVariants` (`src/lib/admin.functions.ts`) mit `{ productId, count }` — sie lädt Produktname, Kategoriepfad und bestehende Varianten und filtert Dubletten bereits serverseitig.
4. **Ergebnis**: Vorschläge als anklickbare Chips (standardmässig alle ausgewählt); „Übernehmen" (`adm.variantSuggestApply`) fügt die gewählten Varianten in den lokalen `variants`-State des Dialogs ein (case-insensitiv dedupliziert gegen vorhandene Einträge). Gespeichert wird erst bei „Speichern" — wie alle anderen Felder des Dialogs.
5. **Fehlerfall**: Toast bei 402/429 (Credits/Rate-Limit), Meldung `adm.variantSuggestNone` wenn nichts Neues vorgeschlagen wurde.

## Keine Änderungen an
- Server-Funktion `suggestVariants` (existiert bereits, wird wiederverwendet).
- i18n: alle Schlüssel (`adm.variantSuggest`, `adm.variantSuggestConfirm`, `adm.variantSuggestApply`, `adm.variantSuggestNone`, `adm.suggestCount`) sind bereits in allen 16 Sprachen vorhanden.
- Schnell-Dialog (Etiketten-Symbol) und Speicherlogik bleiben unverändert.

## Prüfung
- Typprüfung + Build.
- Browser-Test: Produkt (z. B. Paprika) im Admin bearbeiten → Vorschläge erzeugen → Chips ab-/auswählen → Übernehmen → Varianten erscheinen in der Liste, erst nach „Speichern" wirksam.
