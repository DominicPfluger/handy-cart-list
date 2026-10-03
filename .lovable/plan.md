# Anzahl der Produktvorschläge wählbar machen

Im Admin-Dialog „Fehlende Produkte vorschlagen" (✨, unter „+ mehrere Produkte einordnen") erzeugt die KI heute immer 8–15 Vorschläge. Neu wählt die Nutzerin im Bestätigungs-Dialog, wie viele Vorschläge angezeigt werden.

## Umsetzung

1. **Bestätigungs-Dialog** (`BulkAddForm` in `src/routes/_authenticated/admin.tsx`):
   - Neues Auswahlfeld „Anzahl Vorschläge" mit Optionen **5, 10, 15, 20, 25** (Voreinstellung 15, wie bisher).
   - Der gewählte Wert wird an die Suche übergeben.
2. **Weiterleitung**: `onSuggest`/`loadSuggestions` (admin.tsx) übergeben den Wert an die Server-Funktion `suggestProducts` (`src/lib/admin.functions.ts`); Schema `ctxSchema` um `count: number` (5–25, Voreinstellung 15) erweitern.
3. **KI-Auftrag**: Im Prompt von `suggestProducts` statt der festen 8–15 die gewünschte Anzahl einsetzen („Schlage {count} relevante Produkte vor …"). Nach dem Herausfiltern von Duplikaten können es leicht weniger sein — der Dialog zeigt, was übrig bleibt.
4. **Übersetzungen**: Neuer i18n-Schlüssel (z. B. `adm.suggestCount` = „Anzahl Vorschläge") in allen 16 Sprachen (`de.ts` + `messages.json`).

## Prüfung

- Typprüfung und Build.
- Browser-Test: Dialog öffnen, Anzahl 5 wählen → es erscheinen ca. 5 Vorschläge zum Übernehmen.
