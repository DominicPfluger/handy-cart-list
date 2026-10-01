# Kategoriebild hochladen im Admin-Panel

## Ziel
Admins können im Admin-Panel direkt ein Bild für eine Kategorie hochladen — ohne dass Bilder manuell vorbereitet und einzeln zugewiesen werden müssen.

## Was gebaut wird

### 1. Upload im Kategorie-Editor (Admin-Panel)
- Im Bearbeiten-Dialog einer Kategorie erscheint ein neuer Bereich **„Kategoriebild"** mit:
  - Vorschau des aktuellen Bildes (falls vorhanden)
  - Button **„Bild hochladen"** (Dateiauswahl: JPG, PNG, WebP)
  - Button **„Bild entfernen"** (setzt die Kategorie zurück auf Emoji)
- Nach der Auswahl wird das Bild **automatisch im Browser vorbereitet**:
  - auf 512 × 512 px zugeschnitten/verkleinert
  - als PNG mit transparentem Hintergrund gespeichert (Ziel: 60–100 KB)
- Danach wird es in den Cloud-Speicher (`catalog-images`, Pfad `departments/<kategorie-id>.png`) hochgeladen und der Kategorie zugewiesen.
- Das neue Bild ist sofort im Admin-Panel und nach dem nächsten Laden auch in der Abteilungsansicht sichtbar.

### 2. Zugriffsrechte (Migration)
- Der Bild-Speicher erlaubt aktuell nur das **Lesen**. Neue Regeln:
  - **Hochladen, Überschreiben, Löschen** von Bildern: nur Admins
  - Lesen bleibt für alle offen (wie bisher)

### 3. Anzeige
- In der Kategorie-Liste des Admin-Panels wird bei Kategorien mit Bild eine **Miniatur-Vorschau** statt des Emojis gezeigt.

## Technische Details
- Dateien: `src/routes/_authenticated/admin.tsx` (EditDialog + Liste), neue Hilfsfunktion `src/lib/image-upload.ts` (Verkleinern per Canvas, Upload via Supabase Storage)
- `departments.image_path` wird auf den neuen Pfad gesetzt; signierte URLs liefert der bestehende Katalog-Ladevorgang (`catalog.functions.ts`) automatisch
- Migration: `INSERT`/`UPDATE`/`DELETE`-Policies auf `storage.objects` für Bucket `catalog-images` mit `has_role(auth.uid(), 'admin')`
- Kein Eingriff in Produktbilder (bleiben wie bisher); Erweiterung auf Produkte später möglich
