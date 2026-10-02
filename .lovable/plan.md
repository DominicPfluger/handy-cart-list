# Mehrere Produkte per Checkbox auswählen und gemeinsam verschieben

## Was du bekommst
In der Produktliste einer Kategorie (Admin-Panel, Katalog) erhält jede Produktzeile links eine Checkbox.
- Sobald mindestens ein Produkt angehakt ist, erscheint oben eine kleine Leiste: „3 ausgewählt“ · „Alle“ · „Auswahl aufheben“.
- Ziehst du ein angehaktes Produkt am Symbol, wandern **alle angehakten Produkte gemeinsam** mit (Ziehvorschau zeigt „+2“).
- Ablegen funktioniert wie beim Einzelprodukt:
  - zwischen zwei Produkten (grüne Linie) bzw. unter einer Überschrift: die Gruppe wird dort in ihrer bisherigen Reihenfolge eingefügt,
  - auf eine Kategorie-Kachel oder die Pfadnavigation oben: alle ausgewählten Produkte werden in diese Kategorie verschoben.
- Ziehen eines nicht angehakten Produkts verhält sich wie bisher (nur dieses eine).
- Nach dem Verschieben wird die Auswahl geleert. Beim Wechsel der Kategorie ebenfalls.
- Alias-Produkte (aus anderen Kategorien eingeblendet) können angehakt und umsortiert, aber nicht in eine andere Kategorie verschoben werden – sie werden dabei übersprungen.
- Gilt global oder – bei gewähltem Markt – nur für diesen Markt, wie heute.
- Neue Texte in allen 16 Sprachen.

## Technische Details
- `catalog-tile-editor.tsx`: State `selected: Set<string>`; Checkbox (shadcn `Checkbox`) vor dem Produktsymbol in der `data-drop="product"`-Zeile; Auswahlleiste über der Produktliste; Reset bei `p.cur`-Wechsel. In `onUp`: wenn `d.id` in `selected` und Größe > 1 → Mehrfachpfad, sonst bestehende Logik.
  - Umsortieren: neuer Callback `onMoveProducts(ids, insertAt, headingId)`; Zielindex bezogen auf die Liste ohne die ausgewählten Produkte (Index minus Anzahl ausgewählter davor).
  - Kategorie/Pfad: ein `update products set department_id` mit `.in("id", ownIds)` (ohne Alias-Ids) über `p.run`.
- `admin.tsx`: `moveProduct` zu `moveProducts(list, ids[], to, headingId)` verallgemeinern (bestehende Einzelfunktion ruft es mit einem Id auf): Block entfernen, an Zielstelle einfügen, Überschriften-Anker wie bisher neu berechnen, eine `saveOrder`-Speicherung.
- i18n: `adm.selectedCount`, `adm.selectAll`, `adm.clearSelection` in `de.ts` + 15 Lokale. Keine Datenbankänderung.

## Prüfung
Build; Playwright in einer Testkategorie: zwei Produkte anhaken, nach unten/oben ziehen, auf Überschrift und auf andere Kategorie ablegen, Reihenfolge nach Neuladen kontrollieren, Testdaten zurücksetzen.
