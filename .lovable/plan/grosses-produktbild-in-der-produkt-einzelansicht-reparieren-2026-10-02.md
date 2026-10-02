# Grosses Produktbild in der Produkt-Einzelansicht reparieren

## Warum es nicht lädt
Die Produkt-Einzelansicht (aus Abteilungen geöffnet) nimmt die Katalogdaten direkt vom Server. Dort ist die Bildadresse bewusst immer leer — die Bildadressen werden separat geladen und nur in der normalen Katalogansicht (Abteilungen, Liste) eingemischt. Die Einzelansicht überspringt diesen Schritt, darum erscheint immer nur das Emoji.

## Änderung
- Die Einzelansicht nutzt dieselbe Katalogquelle wie die Abteilungen, damit die Bildadresse vorhanden ist (inkl. persönlicher Namen).
- Das grosse Bild wird über den bestehenden Geräte-Bildspeicher geladen: einmal vom Server, danach lokal — wie die kleinen Icons.
- Bei fehlendem Bild oder Ladefehler: Emoji als Ersatz.
- Das grosse Foto erscheint unabhängig von der Einstellung „Pixelgrafiken/SVG-Grafiken" (die gilt nur für kleine Icons).
- Hinweis: Nur ca. 80 Produkte haben überhaupt ein Bild; bei den anderen bleibt das Emoji.

## Technische Details
- `src/routes/produkt.$id.tsx`: `useSuspenseQuery(catalogQueryOptions)` durch `useCatalog()` ersetzen (Loader bleibt); `<img src={product.imageUrl}>` durch die vorhandene CachedImage-Komponente mit `path={product.imagePath}`, `signedUrl={product.imageUrl}` und Emoji-Fallback ersetzen.
- Prüfen, ob `catalog-product-dialog.tsx` dieselbe Lücke hat, und gleich behandeln.
- Verifikation per Playwright: Produkt mit Bild (z. B. Spinat) öffnen, Bild sichtbar, nach Reload ohne erneuten Download.
