# Fotonotiz im Dialog „Produkt hinzufügen“

## Ziel
Im Dialog, der beim Antippen eines Produkts in der Abteilungsansicht erscheint, gibt es ganz unten (unter „Notiz“, vor dem Hinzufügen-Knopf) den Bereich „Fotonotiz“. Ein Tipp darauf öffnet auf dem Handy direkt die Kamera. Am Computer öffnet sich die Dateiauswahl.

## Verhalten
- Knopf „📷 Foto aufnehmen“. Nach der Aufnahme erscheint ein kleines Vorschaubild mit ✕ zum Entfernen und der Möglichkeit, das Foto neu aufzunehmen.
- Beim Hinzufügen wird das Foto an den neuen Listeneintrag gehängt. Wählst du mehrere Sorten, bekommt jeder Eintrag das Foto.
- Das Foto bleibt nur auf deinem Gerät, wie bisher bei Listenfotos. Wer die Liste mit dir teilt, sieht nur den Text.
- In der Einkaufsliste zeigt ein Eintrag mit Foto ein kleines Vorschaubild. Ein Tipp darauf zeigt das Foto gross.
- Neue Texte werden in alle 16 Sprachen übersetzt.

## Technische Details
- `catalog-product-dialog.tsx`: unten ein verstecktes `<input type="file" accept="image/*" capture="environment">`, Vorschau-Zustand mit Blob, Verkleinerung über `prepareItemPhoto`.
- `use-shopping-list.ts`: `addCatalogItem` gibt die temporäre Eintrags-ID zurück. Ersetzt die Cloud den temporären Eintrag durch die endgültige ID (`replaceItemLocally`), wird das Foto im Gerätespeicher auf die neue ID umgezogen. Dafür kommt eine Hilfsfunktion `moveItemPhoto` in `item-photo-store.ts` dazu.
- Der Dialog speichert das Foto pro zurückgegebener ID mit `putItemPhoto`.
- Listenzeile in `index.tsx`: kleines Vorschaubild, wenn ein Foto existiert. Dafür eine schlanke Nur-Anzeige-Variante der vorhandenen `ItemPhoto`-Komponente (Miniatur + Grossansicht), ohne die früher entfernten Aufnahme-Knöpfe in der Liste wieder einzubauen.
- i18n: `dlg.photoNote`, `dlg.photoTake`, `dlg.photoRemove` in de.ts + messages.json.
- Prüfung: Typecheck, Browser-Test mit Testbild über die Dateiauswahl, danach das Foto in der Liste kontrollieren.
