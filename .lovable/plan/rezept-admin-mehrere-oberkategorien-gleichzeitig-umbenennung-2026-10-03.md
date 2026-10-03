# Rezept-Admin: Mehrere Oberkategorien gleichzeitig + Umbenennung

## Ziel
Im Admin-Panel unter „Rezept-Generator" → „Rezept-Verwaltung":

1. **Mehrere Oberkategorien auf einmal anlegen** — im Formular „+ Oberkategorie" kann pro Zeile eine Kategorie eingegeben werden (mehrzeiliges Eingabefeld). Jede Zeile wird eine eigene Oberkategorie, in der eingegebenen Reihenfolge.
2. **Umbenennung** — der Bereich „Rezept-Kategorien" heisst neu „Zutaten-Kategorien" (in allen 16 Sprachen).

## Umsetzung (src/components/recipe-admin.tsx)

1. **Mehrfach-Anlage:**
   - Das Namen-Feld im Kategorie-Formular wird beim **Neuanlegen einer Oberkategorie** (kein bestehender Eintrag, keine Unterkategorie) zu einem mehrzeiligen Textfeld: eine Kategorie pro Zeile, leere Zeilen werden ignoriert.
   - `saveGroup` legt alle Zeilen nacheinander an (Name, Emoji gilt für alle bzw. bleibt leer, `sort_order` fortlaufend ans Ende).
   - Beim **Bearbeiten** einer bestehenden Kategorie und bei **Unterkategorien** bleibt es beim einzeiligen Feld (dort ist Mehrfach-Anlage nicht sinnvoll).

2. **Umbenennung „Zutaten-Kategorien":**
   - `adm.recipeGroups` in `src/i18n/de.ts`: „Zutaten-Kategorien" (de, de-AT, de-CH).
   - Übersetzungen in `src/i18n/messages.json` für alle 15 weiteren Sprachen, z. B. en: „Ingredient categories", fr: „Catégories d'ingrédients", it: „Categorie di ingredienti", es: „Categorías de ingredientes", pt: „Categorias de ingredientes", nl: „Ingrediëntencategorieën".

## Technisch
- Keine Datenbankänderung; Kategorien werden weiterhin über die bestehende Server-Funktion `saveRecipeGroup` angelegt (pro Zeile ein Aufruf).
- Emoji-Feld bleibt optional und gilt für alle neuen Zeilen.

## Prüfung
- Typprüfung + Build.
- Browser-Test: Drei Oberkategorien per Zeilenumbruch anlegen, Reihenfolge und Anzeige prüfen; Bereichstitel zeigt „Zutaten-Kategorien"; Testkategorien danach wieder löschen.
