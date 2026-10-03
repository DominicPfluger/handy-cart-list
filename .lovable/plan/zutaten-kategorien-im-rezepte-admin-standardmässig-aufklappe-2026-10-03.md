# Zutaten-Kategorien im Rezepte-Admin standardmässig aufklappen

## Änderung
Im Rezepte-Admin („Rezept-Verwaltung", Tab Rezepte) ist der Bereich **„Zutaten-Kategorien"** beim Öffnen zugeklappt. Er soll standardmässig aufgeklappt sein — genau wie „Vorlagen" und „Schritte".

## Technische Umsetzung
- `src/components/recipe-admin.tsx`, Zeile 75: `const [groupsOpen, setGroupsOpen] = useState(false);` → `useState(true);`
- Sonst nichts: Auf-/Zuklappen per Pfeil, Drag & Drop, Stift/Papierkorb und alle anderen Bereiche bleiben unverändert. Das Zuklappen von Hand funktioniert weiterhin.

## Prüfung
- Typprüfung und Build.
- Browser-Test: Rezepte-Admin öffnen, Vorlage wählen — „Zutaten-Kategorien" ist offen sichtbar; Zuklappen klappt.
- roadmap.md ergänzen.
