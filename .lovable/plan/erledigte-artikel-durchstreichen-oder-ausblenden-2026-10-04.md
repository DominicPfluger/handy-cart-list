# Erledigte Artikel: Durchstreichen oder Ausblenden

## Was sich ändert
- Unter Einstellungen (Bereich „Darstellung & Vorlesen") neue Auswahl **„Erledigte Artikel"** mit zwei Optionen:
  - **Durchstreichen** (Standard, wie bisher)
  - **Ausblenden**
- Bei „Ausblenden" verschwinden abgehakte Artikel sofort aus der Einkaufsliste. Abteilungen, in denen alles erledigt ist, werden ebenfalls ausgeblendet.
- Damit nichts verloren wirkt, erscheint unten in der Liste ein kleiner Hinweis „n erledigt – anzeigen", der die erledigten Artikel vorübergehend einblendet (z. B. um einen Haken rückgängig zu machen). Der bestehende Knopf zum Entfernen erledigter Artikel bleibt.
- Die Wahl gilt nur für dieses Gerät.

## Technische Details
- Neuer Hook `src/hooks/use-checked-display.ts`: localStorage-Schlüssel `shoppi:checked-display` (`"strike"` | `"hide"`, Standard `strike`), Änderungs-Event für Live-Update, Lesen in `useEffect` (kein Hydration-Mismatch).
- `src/routes/mehr.tsx`: Segment-/Select-Steuerung im Darstellungs-Block.
- `src/routes/index.tsx`: bei `hide` und nicht aufgeklapptem Hinweis `checked`-Items aus den Gruppen filtern, leere Gruppen entfernen; Hinweiszeile mit `doneCount`. Kaufmodus unverändert.
- i18n-Schlüssel (`settings.checkedDisplay`, `.strike`, `.hide`, `list.showDone`, `list.hideDone`) in `de.ts` und allen Locales in `messages.json`.
- Kein Datenbank-Eingriff.
