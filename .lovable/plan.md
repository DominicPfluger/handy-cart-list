# Button „+ Oberkategorie" umbenennen in „+ Neue Zutaten-Kategorie"

## Was geändert wird
Im Rezepte-Admin (Rezept-Verwaltung) im Bereich „Zutaten-Kategorien" heisst der Button „+ Oberkategorie" neu „+ Neue Zutaten-Kategorie".

## Umsetzung
- Der Button-Text steht im Übersetzungsschlüssel `adm.recipeGroupNew` (verwendet in `src/components/recipe-admin.tsx`).
- `src/i18n/de.ts`: `adm.recipeGroupNew` → „+ Neue Zutaten-Kategorie".
- `src/i18n/messages.json`: denselben Schlüssel in den 15 weiteren Sprachen anpassen (z. B. en „+ New ingredient category", es „+ Nueva categoría de ingredientes", fr „+ Nouvelle catégorie d'ingrédients", it „+ Nuova categoria ingredienti", pt „+ Nova categoria de ingredientes", nl „+ Nieuwe ingrediëntencategorie", de-AT/CH wie Deutsch, nordische/slavische Sprachen sinngemäss).

## Nicht geändert
- Der Tab-Name „Rezept-Verwaltung", der Button „Neue Rezept-Kategorie" und alle anderen Texte bleiben unverändert.
- Keine Funktions-, DB- oder Layout-Änderungen.
