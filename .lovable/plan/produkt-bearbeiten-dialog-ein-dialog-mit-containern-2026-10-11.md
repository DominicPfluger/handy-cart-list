# Produkt-Bearbeiten-Dialog: Ein Dialog mit Containern

## Ziel
Es gibt nur noch **einen** Produkt-Bearbeiten-Dialog — den bisherigen Kachelmodus-Dialog (ItemSheet in `src/components/admin/catalog-tile-editor.tsx`). Der ⚙-Erweitert-Dialog (`Editor`-Komponente in `src/routes/_authenticated/admin.tsx`) entfällt für Produkte; seine Funktionen wandern als zugeklappte Container in den einen Dialog. Für Kategorien und Überschriften bleibt der bestehende `Editor`-Pfad unverändert (er wird dort weiterhin über Suchergebnisse geöffnet).

## Container im einen Dialog (ItemSheet)
Alle Container zugeklappt mit Titel + Chevron; geöffnet zeigt den Inhalt. Neues gemeinsames Bauteil `SectionCollapse` (in `src/components/admin/preview-collapse.tsx`): aufklappbare Karte analog `PreviewCollapse`, mit Titel, optionalem Emblem, Slot.

1. **Bilder** (ein Container): Kopfzeile zeigt kleines Vorschaubild + kleines Icon nebeneinander. Aufgeklappt: grosses Vorschaubild, darunter das Icon klein, und alle bisherigen Aktionen beider Blöcke (Hochladen, Bild wählen, KI-Optionen für Vorschaubild und Icon getrennt, Icon aus Bild übernehmen, Bild entfernen). Ersetzt die bisher getrennten `PreviewCollapse`/`IconCollapse`-Blöcke; `imageOnly`-Modus startet aufgeklappt.
2. **Varianten** (zugeklappt): bestehender Varianten-Block unverändert (Positionsknopf, Synonyme, Übersetzungen, Bilder, KI-Vorschläge).
3. **Sprachen** (zugeklappt): bestehende `SheetTranslations` + „Neu übersetzen"-Knopf (bestehende `onRetranslate`-Funktion aus admin.tsx, neu als Prop in den Tile-Editor gereicht).
4. **Länderküchen** (zugeklappt): `ProductCuisinePicker` (aus `cuisine-admin.tsx`), nur bei Lebensmitteln (kein Non-Food-Wurzelkatalog — gleiche Prüfung wie bisher).

## Aus dem Erweitert-Dialog übernommen (jeweils eigener, zugeklappter Container)
- **Ernährungsformen** (Diät-Chips + `excluded_diets` im Speichern des ItemSheet)
- **Synonyme** (`ProductSynonymEditor`)
- **Marken** (`ProductBrandEditor`)
- **Aliase** (`ProductAliasEditor` — wichtig: Alias-Produkte öffnen bisher den Erweitert-Dialog; künftig den einen Dialog)

Nicht doppelt übernehmen: Menge/Einheit, Überschrift, Aussprache, Preise — alles schon im ItemSheet vorhanden.

## Entfernen / Aufräumen in `admin.tsx`
- ⚙ „Erweitert"-Knopf und `onAdvanced`-Prop aus dem Tile-Editor-Aufruf entfernen; Stift bei Alias-Produkten öffnet den einen Dialog.
- `Editor`-Komponente: Produkt-Zweig entfernen (Kategorie/Überschrift bleibt). Suchergebnisse, Bilder-/Preis-Panel und Pflege-Panel mit `kind: "product"` öffnen künftig den einen Dialog: neuer Prop `editTarget`/`onEditHandled` an `CatalogTileEditor`, der intern `target` setzt (Wechsel auf Reiter „Katalog" bleibt).
- Ungenutzte Keys/Importe aufräumen; `tile.advanced` bleibt bewusst in de.ts (Muster wie `st.resetAll`).

## i18n
- Neuer Key `adm.images` („Bilder") in `src/i18n/de.ts` + alle 15 Locale-Dateien. Alle übrigen Titel existieren bereits (`adm.variants`, `adm.languages`, `adm.cuisines`, `adm.diets` …).

## Verifizierung
- Typecheck/Build kontrollieren.
- Playwright: Produkt im Kachelmodus bearbeiten — vier Container zugeklappt, Bilder-Container zeigt beim Aufklappen grosses Bild + Icon, Ernährungsformen/Synonyme/Marken/Aliase/Länderküchen erreichbar; Alias-Produkt öffnet den einen Dialog; Speichern inkl. Ernährungsformen prüfen.
