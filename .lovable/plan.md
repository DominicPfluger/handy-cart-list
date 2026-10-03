# KI-Bild-Optionen im Produkt-Bearbeiten-Dialog erweitern

## Ausgangslage

Der Bild-Dialog (src/components/admin/catalog-tile-editor.tsx) hat heute nur ein einzeiliges Stichwortfeld (`hint`), das an `generateImageFor` → `generateProductImage` (src/lib/product-media.server.ts) geht. Der Prompt ist fest verdrahtet (Foto-Stil, transparenter Hintergrund, einzelnes Produkt, zentriert).

## Was sich ändert

Im Bild-Dialog (für Produkte und Kategorien) erscheint unter dem Vorschaubild ein aufklappbarer Bereich **„KI-Bild-Optionen"** mit:

1. **Stichworte** — das bestehende Feld (z. B. „rot, geschnitten"), bleibt erhalten.
2. **Stil** — Auswahl: `Foto` (Standard, wie bisher) oder `Illustration` (flache, freundliche Vektor-Illustration).
3. **Hintergrund** — Auswahl: `Transparent` (Standard, wie bisher), `Weiss` oder `Sanfter Farbverlauf` (dezente, zur App passende Farbfläche).
4. **Ansicht** — Auswahl: `Frontal` (Standard), `Leicht von oben` oder `Seitlich`.
5. **Anzahl** — Auswahl: `Einzeln` (Standard) oder `Kleine Gruppe` (2–3 Exemplare).

Die Auswahl wird erst beim Klick auf „✨ KI-Bild neu erzeugen" wirksam; die Bestätigungsfrage vor dem Credits-Verbrauch bleibt. Ohne Änderung an den Optionen bleibt das Ergebnis exakt wie bisher.

## Technische Details

- **Server (src/lib/product-media.server.ts):** `generateProductImage(name, emoji, hint, opts?)` erhält ein optionales Options-Objekt `{ style?, background?, view?, count? }`. Die Werte werden als kurze englische Prompt-Bausteine an den bestehenden Prompt angehängt (z. B. „flat friendly vector illustration style", „on a pure white background", „viewed slightly from above", „small group of 2–3 items"). Bei `background !== "transparent"` wird der API-Parameter `background: "transparent"` weggelassen. Die Stilregel „keine Kräuter, Zusätze, Gefässe" bleibt immer im Prompt.
- **Server-Funktion (src/lib/product-media.functions.ts):** `generateImageFor`-Schema wird um das optionale `opts`-Objekt (alle Felder optional, Enums) erweitert und durchgereicht. Bestehende Aufrufe (Schnell-✨ in der Liste, Varianten, Icon-KI, Massenerzeugung) bleiben unverändert und nutzen weiterhin die Standardwerte.
- **Dialog (src/components/admin/catalog-tile-editor.tsx):** Neuer `<details>`-Block „KI-Bild-Optionen" unter der Vorschaubild-Zeile; vier `select`-Elemente + das bestehende Stichwortfeld wandert hinein. Die Auswahl liegt in einem State `imgOpts` und wird an `generateDialogImage()` (und an die Icon-KI im selben Dialog) übergeben.
- **i18n:** Neue Schlüssel `tile.aiOptions` („KI-Bild-Optionen"), `tile.aiStyle`, `tile.aiStylePhoto`, `tile.aiStyleIllustration`, `tile.aiBackground`, `tile.aiBgTransparent`, `tile.aiBgWhite`, `tile.aiBgGradient`, `tile.aiView`, `tile.aiViewFront`, `tile.aiViewTop`, `tile.aiViewSide`, `tile.aiCount`, `tile.aiCountSingle`, `tile.aiCountGroup` in `src/i18n/de.ts` und allen 15 weiteren Sprachen in `messages.json`.
- Keine DB-Änderung; Optionen werden nicht gespeichert, sondern gelten pro Erzeugung.

## Prüfung

- Typprüfung und Build.
- Browser-Test: Dialog öffnen, Optionen aufklappen, Stichwort + Optionen wählen, Bestätigungsfrage erscheint (im Test abbrechen, damit keine Credits verbraucht werden).
