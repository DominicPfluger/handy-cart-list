# Zutaten-Kategorien in separatem Container

## Hintergrund
Im Rezepte-Admin (`src/components/recipe-admin.tsx`, Komponente `RecipeAdmin`) ist der Bereich „Zutaten-Kategorien" (Zustand `groupsOpen`, `aria-controls="recipe-admin-groups"`) nur durch eine untere Trennlinie (`border-b border-border pb-4`) vom darüberliegenden Bereich getrennt — er steht also ohne eigenen Rahmen direkt im Rezept-Verwaltung-Container. Andere Bereiche (z. B. die Vorlagen-Verwaltung) haben bereits einen eigenen umrandeten Container (`rounded-lg border border-border bg-background p-2`).

## Änderung
Nur in `src/components/recipe-admin.tsx`:

- Der äusseren Div des Zutaten-Kategorien-Bereichs (aktuell `className="space-y-2 border-b border-border pb-4"`, ca. Zeile 399) einen eigenen Container-Stil geben, passend zum Stil der Vorlagen-Verwaltung: `space-y-2 rounded-lg border border-border bg-background p-2`.

Sonst nichts:
- Auf-/Zuklappen per Pfeil, „Neue Oberkategorie"-Knopf, Drag & Drop, Stift/Papierkorb-Icons, das Eingabeformular und alle Funktionen bleiben unverändert.
- Keine i18n-Änderungen, keine DB-Änderungen, keine weiteren Dateien.

## Prüfung
- Typprüfung/Build.
- Browser-Test: Rezept-Verwaltung öffnen, Vorlage wählen — Zutaten-Kategorien erscheinen in einem eigenen umrandeten Container; Auf-/Zuklappen und das Formular funktionieren.
