# Sprachen-Tab: Anlegen-Formular nach unten, Suchfeld für Sprachen

## Ausgangslage

Im Admin-Tab „Sprachen" (`src/components/admin/locale-admin-panel.tsx`) steht das Formular „Sprache anlegen & übersetzen" derzeit zuoberst. Darunter folgen „Eingerichtete Sprachen" (16 Built-in-Sprachen), die Vorschläge-Chips und die selbst angelegten Sprachen.

## Neu: Reihenfolge

1. Titel + Hinweis (unverändert)
2. **Eingerichtete Sprachen** (16 Built-in, read-only Liste)
3. **Eigene Sprachen** (angelegte Locales mit Fortschritt, „Weiter übersetzen", ✕)
4. **Suchfeld** (neu, direkt unter den Sprach-Listen)
5. **Vorschläge** (Chips, vom Suchfeld gefiltert)
6. **„Sprache anlegen & übersetzen"** (Formular mit Flagge, Sprachcode, Name + Button) — zuunterst

## Suchfeld

- Ein Such-Input unterhalb der Sprach-Listen: filtert die Vorschlags-Chips nach Sprachcode (z. B. „pl-PL") und Name (z. B. „Polski" / „Polnisch") — Gross-/Kleinschreibung ignoriert.
- Leeres Suchfeld = alle Vorschläge wie bisher.
- Kein Treffer = kurzer Hinweistext statt leerer Fläche.
- Tipp auf einen Chip: wie bisher Rückfrage → Sprache anlegen & übersetzen.

## Technisch

- Nur `src/components/admin/locale-admin-panel.tsx`: Formular- und Suggest-Blöcke verschieben, neuer `search`-State, Filterung von `SUGGESTED`.
- Neuer i18n-Key `loc.search` („Sprache suchen") in `src/i18n/de.ts` und allen 15 Locales in `messages.json`; Hinweistext bei 0 Treffern ebenfalls als Key (`loc.noMatch`).
- Keine Datenbank- oder Serverfunktionen-Änderung; Anlege-Logik (Automatik-Übersetzung, Fortschritt) bleibt unverändert.

## Verifikation

- Build fehlerfrei.
- Preview: Sprachen-Tab zeigt Listen zuoberst, Suchfeld filtert Chips live, Anlegen-Formular steht zuunterst und funktioniert (ohne eine echte Sprache anzulegen).
