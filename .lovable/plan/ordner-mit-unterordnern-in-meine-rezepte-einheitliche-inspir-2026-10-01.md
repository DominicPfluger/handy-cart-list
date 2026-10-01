# Ordner mit Unterordnern in „Meine Rezepte“ + einheitliche Inspirationen-Darstellung

## 1. Ordner und Unterordner (Rezept-Listen)
Bisher gibt es nur eine Ebene von Ordnern. Neu:

- Jeder Ordner kann Unterordner enthalten, auch mehrere Ebenen tief, z. B. „Abendessen > Vegetarisch > Schnell“.
- Ordner lassen sich auf- und zuklappen (Pfeil ▸/▾). Daneben steht die Anzahl der Rezepte, die Unterordner mitgezählt.
- Jeder Ordner bekommt einen Knopf „+ Unterordner“. Unterordner sind eingerückt, damit man die Struktur gut erkennt.
- Rezepte ziehst du wie bisher per Ziehen in jeden Ordner oder Unterordner. Ordner selbst lassen sich auch in einen anderen Ordner ziehen.
- Wenn du einen Ordner löschst, wandern seine Rezepte und Unterordner eine Ebene nach oben. Es geht also kein Rezept verloren. Vorher wird nachgefragt.
- Beim Speichern eines Rezepts kannst du jeden Ordner und Unterordner als Ziel wählen. Er erscheint mit vollem Pfad, z. B. „Abendessen › Vegetarisch“.
- Umbenennen per Tipp auf den Namen funktioniert wie bisher.
- Neue Texte werden in alle 16 Sprachen übersetzt.

## 2. Rezept-Inspirationen einheitlich und untereinander
Heute haben die Bereiche unterschiedliche Darstellungen: „Am besten bewertet“, „Am häufigsten gespeichert“ und „Mit deinen Lieblingszutaten“ als seitlich wischbare Kacheln, „Beliebt“ und „Neue Kreationen“ als schmale Zeilen. Neu:

- Alle Bereiche zeigen ihre Einträge **untereinander** im gleichen Kartenstil: Foto oder farbiges Kategorie-Symbol links, rechts Titel, Beschreibung bzw. Zutaten und Bewertung/Anzahl.
- Alle Überschriften bekommen das farbige Symbol-Kästchen. „⭐ Beliebt“ bekommt es neu dazu.
- Pro Bereich erscheinen zuerst 5 Einträge, darunter „Alle anzeigen“ bzw. „Weniger anzeigen“.

## Technische Details
- Migration: `recipe_folders.parent_id uuid null references recipe_folders(id) on delete set null`, Index auf parent_id. Ein Trigger verhindert Zyklen, also dass ein Ordner in sich selbst oder einen eigenen Unterordner verschoben wird. Die bestehenden RLS-Regeln bleiben, weil nur der Eigentümer zugreift.
- Löschen: Vor dem Delete werden die `recipe_saves.folder_id` und die Kinder-`parent_id` per Client-Update auf den Elternordner gesetzt.
- `use-saved-recipes.ts`: `parentId` in `RecipeCollection`; `createFolder(name, parentId?)`, `moveFolder(id, parentId)`; Helfer `buildTree` / `folderPath`.
- `saved-recipes-board.tsx`: rekursive `FolderNode`-Komponente mit Einrückung, Collapse-State in localStorage, Droppable pro Ordner, Ordner-Drag mit dnd-kit.
- `recipe-builder.tsx`: Die Ordnerauswahl im Speichern-Dialog zeigt den Pfad. `popularView` und `recentView` nutzen eine gemeinsame `RecipeListCard`.
- `recipe-feed.tsx`: Die horizontale Snap-Scroll-Leiste wird zu einer vertikalen Liste mit derselben Karte, gekürzt auf 5 Einträge mit Aufklappen.
- i18n: `rk.addSubfolder`, `rk.deleteFolderConfirm`, `rk.moveFolder`, `rs.showAll` in de.ts und messages.json.
- Prüfung in der Vorschau: Unterordner anlegen, ein Rezept hineinziehen, Ordner löschen und Rezepte prüfen, Inspirationen-Seite ansehen.
