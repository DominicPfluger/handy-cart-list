# Listen-Übersicht: Verschieben, Löschen, Als Vorlage speichern + Vorlagen anzeigen

## Was du siehst
- **Listen** in der Hauptübersicht lassen sich per Drag & Drop (Griff-Symbol links) neu anordnen – auch per Touch auf dem Handy.
- Jede Listenzeile bekommt rechts zwei kleine Symbole: **Als Vorlage speichern** (mit Bestätigungs-Toast) und **Löschen** (mit Rückfrage).
- Unter den Listen erscheint ein neuer Bereich **Vorlagen**: Jede Vorlage zeigt Name und Anzahl Artikel. Klick erstellt daraus eine neue Liste und öffnet sie. Vorlagen sind ebenfalls per Drag & Drop sortierbar und löschbar.
- Der Bereich „Vorlagen" wird nur angezeigt, wenn Vorlagen vorhanden sind; sonst ein kurzer Hinweis.

## Technische Details
- `src/routes/index.tsx`, Übersichtsblock (ab Zeile ~391): bestehende Funktionen `reorderLists`, `deleteList`, `saveAsTemplate`, `templates`, `createFromTemplate`, `deleteTemplate`, `reorderTemplates` aus `useShoppingList` direkt nutzen (sind bereits vorhanden, aktuell nur im ListManager-Dialog).
- Drag & Drop mit gleicher Technik wie im ListManager (Pointer-Events, `onReorder(fromId, toId)`); Klick auf Zeile öffnet weiterhin die Liste, Aktions-Buttons mit `stopPropagation`.
- Löschen mit `confirm`-Dialog; Laden-Zuordnung der gelöschten Liste bleibt unberührt.
- Nach `createFromTemplate` die neue Liste öffnen (neue ID ermitteln bzw. Kennungswechsel-Effekt nutzen).
- Neue i18n-Schlüssel in `de.ts` (z. B. `list.templates`, `list.noTemplates`), bestehende `lm.*`-Texte wiederverwenden wo möglich; Übersetzungen ergänzen.
