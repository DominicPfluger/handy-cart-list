# Ernährungsform-Auswahl im Produkt-Bearbeiten-Dialog

## Ziel
Im Admin-Panel kann beim Bearbeiten eines Produkts festgelegt werden, für welche Ernährungsformen es **nicht geeignet** ist (z. B. Gelatine → nicht vegetarisch/vegan/halal/koscher). Diese Angaben steuern den Ernährungsform-Filter in der Abteilungsansicht.

## Was gebaut wird

### Neuer Bereich „Ernährungsformen" im Produkt-Dialog
- Im Produkt-Bearbeiten-Dialog (✎ bei einem Produkt) erscheint unter Menge/Einheit ein neuer Abschnitt **„Nicht geeignet für:"**.
- Alle 15 Ernährungsformen als **anklickbare Chips** (Koscher, Halal, Vegetarisch, Vegan, Glutenfrei, Laktosefrei, Fruktosefrei, Zuckerfrei, Ketogen, Paleo, Low-Carb, Low-Fat, High-Protein, Kalorienreduziert, Clean Eating) — mit den bestehenden Übersetzungen (`diet.*`).
- Angetippte Chips sind markiert = Produkt wird bei diesem Filter ausgeblendet.
- Auswahl wird beim **Speichern** zusammen mit den übrigen Feldern in `products.excluded_diets` gespeichert.
- Hinweistext: „Produkt wird bei aktivem Filter ausgeblendet."

## Technische Details
- Datei: `src/routes/_authenticated/admin.tsx`
- Produkt-Ladeabfrage (Zeile 56) um `excluded_diets` erweitern; `Prod`-Typ ergänzen
- `EditSheet`: neuer State `diets` (aus `prod.excluded_diets`), Chip-Liste nur bei `sel.kind === "product"`, Übergabe im `onSave`-Payload
- Speicher-Handler: `excluded_diets` in das `products`-Update aufnehmen
- Neue i18n-Keys (`adm.diets`, `adm.dietsHint`) in `src/i18n/de.ts` und allen 15 Locales in `messages.json`
- Keine Datenbank-Änderung nötig — die Spalte `products.excluded_diets` existiert bereits
