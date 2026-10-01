# Admin: Katalog wie im Frontend bearbeiten

Im Admin-Bereich kommt ein Umschalter **„Liste | Kacheln"** über dem Hauptkatalog. Die bisherige Listen-Ansicht bleibt unverändert; die neue Kachel-Ansicht sieht aus wie die Abteilungsansicht der App und ist direkt bearbeitbar.

## Was du bekommst

1. **Kachel-Ansicht**
   - Kategorien als farbige Kacheln mit Bild bzw. Emoji (gleiche Farben wie in der App), Pfadleiste oben zum Zurückspringen.
   - Antippen öffnet die Kategorie; darunter die Produkte als Zeilen mit Bild, Name, Menge und Richtpreis – genau wie in der App.

2. **Drag & Drop**
   - Kacheln und Produkte per Ziehen umsortieren.
   - Auf eine Kachel oder einen Eintrag in der Pfadleiste ziehen, um Produkt oder Kategorie dorthin zu verschieben.

3. **Direkt antippen und bearbeiten**
   - Antippen (im Bearbeiten-Modus) öffnet ein kleines Fenster direkt am Eintrag: Name, Emoji, Bild hochladen bzw. KI-Bild erzeugen, Standardmenge + Einheit, löschen.
   - Am Ende jeder Ebene ein „+"-Kachel/-Zeile zum Anlegen neuer Kategorien und Produkte.
   - Namensänderungen werden wie heute automatisch in alle Sprachen übersetzt (eigene Übersetzungen bleiben).

4. **Live-Vorschau**
   - Die Ansicht folgt der gewählten Katalogsprache und dem gewählten Markt – du siehst den Katalog so, wie Nutzer ihn sehen.
   - Änderungen erscheinen sofort, ohne Neuladen; Umschalter „Bearbeiten / Vorschau" blendet die Bearbeiten-Elemente aus.

## Technische Details

- Neue Komponente `src/components/admin/catalog-tile-editor.tsx`, eingebunden in `src/routes/_authenticated/admin.tsx` (Umschalter, nutzt die bereits geladenen `depts`/`products` und die bestehenden Speichern-/Löschen-/Übersetzen-Funktionen der Seite).
- Wiederverwendung: `deptColor` (`dept-colors.ts`), `ProductEmoji`, `useReferencePrices`/`formatRefPrice`, Bild-Upload aus `image-upload.ts`, `generateProductImages` für Einzelbild.
- Drag & Drop mit derselben Pointer-Logik wie in `abteilungen.tsx` (sofortiges Ziehen am Icon, `touch-none`); Sortierung schreibt `sort_order` bzw. `parent_id`/`department_id`. Markt-Sortierung nutzt `product_market_order`, wenn ein Markt gewählt ist.
- Optimistische Aktualisierung im lokalen Zustand + Invalidierung des Katalog-Caches, damit die App die Änderung sofort zeigt.
- Keine Datenbankänderung nötig; Schreibrechte laufen weiter über die Admin-Rolle.
- Neue Texte in `de.ts` + allen 15 Sprachen in `messages.json`.
- Prüfung im Browser als Admin: Kategorie öffnen, Produkt umbenennen, verschieben, sortieren, neu anlegen.
