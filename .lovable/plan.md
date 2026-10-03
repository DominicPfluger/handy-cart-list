# Rezepte-Admin: Stift + Papierkorb bei Zutaten-Kategorien

## Ziel
Im Rezepte-Admin-Bereich „Zutaten-Kategorien" erhalten die Zeilen dieselben Icon-Buttons wie Vorlagen und Rezept-Schritte: Stift (Bearbeiten) und Papierkorb (Löschen) direkt neben dem Zieh-Griff, statt der bisherigen Text-Buttons.

## Umsetzung
Datei: `src/components/recipe-admin.tsx`, Zutaten-Kategorien-Zeilen (ca. Zeile 411–417):

- Die beiden Text-Buttons `adm.edit` / `adm.delete` ersetzen durch zwei Icon-Buttons im Stil der Vorlagen-Zeilen (Zeilen 302–307):
  - Bearbeiten: `variant="ghost" size="icon"`, `aria-label`/`title` = `adm.edit`, Pencil-Icon (`h-3.5 w-3.5`), onClick = `startGroup(g.parent_id, g)`
  - Löschen: gleiches Muster, Trash2-Icon, `hover:text-destructive`, onClick = `removeGroup(g)` (Bestätigungsdialog bleibt)
- Keine weiteren Änderungen: Drag & Drop, Unterkategorien-Einrückung, Bestätigungsfragen und Funktionsweise bleiben unverändert.

## Prüfung
- Typprüfung (`tsgo --noEmit`).
- Browser-Test: Rezepte-Admin → Vorlagen wählen → Zutaten-Kategorien: Stift öffnet das Bearbeitungsformular (Name/Emoji), Papierkorb fragt nach und löscht; Icons sitzen direkt neben ⠿.
- roadmap.md ergänzen.
