# Produkt-Aliase

## Ziel
Ein Produkt (z. B. „Kaffeerahm") hat weiterhin genau einen festen Platz im Katalog, kann aber zusätzlich in weiteren Kategorien erscheinen (z. B. „Kaffee & Milchgetränke"). Das Produkt gibt es nur einmal; Änderungen gelten überall. Beim Hinzufügen wählt der User, unter welcher Kategorie es auf der Einkaufsliste landet.

## Was du bekommst

**Abteilungsansicht**
- Alias-Produkte erscheinen in der zusätzlichen Kategorie wie normale Produkte (gleicher Name, Icon, Marken, Varianten).
- Filter (Ernährungsform, Länderküche) und lokales Ausblenden wirken wie beim Original. Die Suche zeigt das Produkt nicht doppelt.

**Hinzufügen-Dialog**
- Hat ein Produkt Aliase, erscheint ein neues Feld „Auf der Liste unter…" mit allen Kategorien, in denen es vorkommt (Original + Aliase).
- Vorausgewählt ist die Kategorie, aus der du das Produkt gerade geöffnet hast. Bei der Suche ist es die Original-Kategorie.
- Der Eintrag wird auf der Einkaufsliste unter der gewählten Kategorie gruppiert. Das funktioniert für lokale und geteilte Listen gleich.

**Admin-Panel**
- Im Produkt-Editor neuer Bereich „Auch anzeigen in…": weitere Kategorien wählen, mit ✕ entfernen.
- In der Produktliste einer Kategorie stehen Alias-Produkte dezent als „Alias" beschriftet; per ▲▼ sortierbar und dort entfernbar (das Original bleibt).
- Ein Alias in der Original-Kategorie selbst ist nicht möglich. Löschen des Produkts entfernt alle Aliase.

## Technische Details
- Neue Tabelle `product_aliases` (id, product_id → products on delete cascade, department_id → departments on delete cascade, sort_order, Zeitstempel; unique(product_id, department_id)). Grants: anon/authenticated SELECT, authenticated schreiben, service_role ALL; RLS: öffentlich lesbar, Schreiben nur `has_role(auth.uid(),'admin')`.
- `getCatalog` lädt `productAliases`; `useCatalog` reicht sie weiter. Produktlisten pro Kategorie ergänzen Alias-Einträge (Original-Produkt mit `aliasIn`), Suche dedupliziert nach Produkt-ID.
- `CatalogProductDialog`: neue Auswahl der Ziel-Kategorie; `groupLabel`/`groupEmoji` kommen aus der gewählten Kategorie (bestehendes Feld `group_label` in `list_items` reicht, keine Listen-Änderung nötig).
- Lokale Drag-&-Drop-Reihenfolge auf Alias-Produkten deaktiviert, Reihenfolge kommt aus dem Admin-Panel.
- Admin: neue Komponente analog `dept-alias-admin.tsx`, eingebunden im Produkt-Editor und in der Produktliste.
- Neue i18n-Keys in `de.ts` und allen 15 Locales; AGENTS.md-Regel für Produkt-Aliase ergänzen.
