# Rezept-Generator: Ebenen immer offen, Kategorien per Klick aufklappen

## Ziel
Im Rezept-Generator werden die Zutaten-Ebenen (z. B. „Salatbasis" beim Salat) dauerhaft aufgeklappt angezeigt — ohne Pfeile. Die grauen Kategorie-Chips darunter (z. B. „Blattsalate", „Gemüse") bleiben inline, zeigen ihre Zutaten aber erst nach einem Klick auf die Kategorie. Alles bleibt inline im Fluss.

## Änderungen (nur `src/components/recipe-builder.tsx`)

1. **Ebenen immer offen, ohne Pfeil**
   - `openStep`-State und der ▲/▼-Umschalter entfallen.
   - Der Ebenen-Kopf (Emoji, Titel, „wähle 1–3") wird zu einem statischen Bereich (kein Button mehr).
   - Der Inhalt (Suchfeld, Kategorien, Zutaten) wird immer gerendert.
   - Die Auswahl-Chips, die bisher nur im zugeklappten Kopf erschienen, bleiben im Kopf sichtbar (gewählte Zutaten der Ebene auf einen Blick).

2. **Kategorien: Zutaten erst nach Klick**
   - Neuer State `openGroups: Record<string, boolean>` (Schlüssel `ebene:kategorie`), wird bei Vorlagenwechsel zurückgesetzt.
   - Der graue Kategorie-Chip wird ein Button (Rahmen und Aussehen bleiben), ohne Pfeil-Symbol.
   - Zutaten der Kategorie erscheinen inline direkt hinter/unter dem Chip, sobald die Kategorie geöffnet ist; erneuter Klick klappt zu. Mehrere Kategorien können gleichzeitig offen sein.
   - Bereits gewählte Zutaten bleiben immer sichtbar — auch in einer zugeklappten Kategorie.
   - „Weitere anzeigen …" (je 10) gilt weiterhin pro geöffneter Kategorie.

3. **Suche bleibt unverändert**: Bei aktiver Suche in einer Ebene werden alle Treffer flach angezeigt (ohne Kategorie-Logik), wie bisher.

## Technische Details
- Keine neuen i18n-Schlüssel nötig (vorhandene Texte werden wiederverwendet).
- Keine Datenbank- oder Admin-Änderungen; Auswahl, Speichern, „Alle hinzufügen" und die Zusammenfassung bleiben unverändert.
- Danach: Typprüfung + Browser-Test (Desktop und Handy): Ebene offen ohne Pfeil, Kategorie klicken → Zutaten erscheinen inline, Auswahl bleibt beim Zuklappen sichtbar.
