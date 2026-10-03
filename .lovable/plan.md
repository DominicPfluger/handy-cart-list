# Admin: Länderküchen in eigenen Tab, Rezepte-Tab umbenennen

## Ziel
Der Abschnitt „Länderküchen" (CuisineAdmin) wandert aus dem Rezepte-Tab in einen eigenen Tab „Länderküchen", der direkt nach dem Rezepte-Tab steht. Der bisherige Tab „Rezepte & Küchen" heisst neu „Rezept-Generator".

## Änderungen

### 1. `src/routes/_authenticated/admin.tsx`
- Tab-State um `"cuisines"` erweitern.
- Tab-Leiste: neuen Eintrag `["cuisines", "adm.tab.cuisines"]` direkt nach `["recipes", …]` einfügen.
- `tab === "recipes"`: `<CuisineAdmin … />` aus dem Block entfernen (RecipeAdmin, RecipeAssignAdmin, RecipeTraitsAdmin bleiben).
- Neuer Block: `tab === "cuisines"` rendert `<CuisineAdmin depts={d.depts} prods={d.prods} />` (mit LoadingGate wie die anderen Tabs).

### 2. i18n (`src/i18n/de.ts` + `src/i18n/messages.json`, alle 16 Sprachen)
- `adm.tab.recipes` umbenennen: „Rezepte & Küchen" → „Rezept-Generator" (de) bzw. „Recipe Generator" (en) usw. in allen Locales.
- Neuer Schlüssel `adm.tab.cuisines`: „Länderküchen" (de), „Cuisines" (en) usw. in allen 16 Locales.

## Technische Details
- Keine Datenbankänderung, keine neuen Komponenten — nur Verschiebung und Umbenennung.
- Bestehende i18n-Schlüssel der Küchen-Verwaltung (adm.cuisines.*) bleiben unverändert.
- Nach der Änderung: Typprüfung + Build prüfen, kurzer Browser-Test der beiden Tabs.
