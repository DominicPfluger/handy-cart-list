# Vorschaubilder zuverlässig anzeigen

## Befund (geprüft)
- Alle 461 Produktbilder sind auf dem Server vorhanden – es fehlt keine Datei.
- Jedes Gerät speichert Bilder bis zu 7 Tage, und zwar unter dem Dateinamen.
- Ein neu erzeugtes KI-Bild überschreibt die alte Datei, der Dateiname bleibt aber gleich. Nur das Admin-Gerät vergisst die alte Version. Alle anderen Geräte und die App-Vorschau zeigen weiter das alte Bild oder gar keins.
- Die Links zu den Bildern laufen nach 1 Stunde ab. Ist ein Bild noch nicht auf dem Gerät gespeichert und die Seite schon länger offen, scheitert der Download mit einem abgelaufenen Link. Dann bleibt das Bild leer, bis die Seite neu geladen wird.

## Lösung
1. **Neuer Dateiname bei jedem neuen Bild**: KI-Bilder, hochgeladene Bilder und Icons erhalten einen eindeutigen Namen (mit Zeitstempel). Dann erkennt jedes Gerät automatisch, dass es ein neues Bild gibt. Die alte Datei wird danach gelöscht.
2. **Abgelaufene Links automatisch erneuern**: Scheitert ein Bild-Download, holt die App einmal frische Links und versucht es erneut. Erst dann erscheint das Ersatz-Symbol.
3. **Einmalige Bereinigung**: Der Bild-Speicher auf den Geräten erhält eine neue Version. Dadurch werden alte, veraltete Bilder einmal verworfen und neu geladen.

## Technische Details
- `product-media.functions.ts` (3 Upload-Stellen) und `product-icon.ts`: Pfad `…/<id>-<timestamp>.webp` statt fester Name; vorherigen `image_path`/`icon_path` nach erfolgreichem DB-Update aus dem Storage entfernen.
- `catalog-image-cache.ts`: `CACHE` → `shoppi-catalog-artwork-v2` (alte Cache löschen); bei 400/403 Fehler werfen, damit der Aufrufer neu signieren kann.
- `ProductIcon`/`DepartmentIcon`/Einzelansicht: bei Fehler einmal `getCatalogImageUrls` neu abfragen (Catalog-Query invalidieren) und erneut laden.
- Keine Änderungen an der Datenbankstruktur.
