# Bildergalerie in separaten Container (Admin → Bilder)

## Ausgangslage
Im Admin-Tab «Bilder» (`src/components/admin/catalog-media-panel.tsx`) wird die Bildergalerie (`<ImageGallery />`, ca. Zeile 269) innerhalb derselben `<section>`-Karte wie die KI-Bild-Generierung gerendert — nur durch eine Trennlinie (`mt-5 border-t border-border pt-4`, Zeile 421) abgesetzt.

## Änderung
In `src/components/admin/catalog-media-panel.tsx`:

1. `<ImageGallery />` aus der bestehenden «Bilder»-Sektion herausnehmen und als eigene Karte darunter rendern:
   ```jsx
   <section className="mt-4 rounded-2xl border border-border bg-card p-4">
     <ImageGallery />
   </section>
   ```
2. In der `ImageGallery`-Komponente die Trennlinien-Klassen `mt-5 border-t border-border pt-4` entfernen (Zeile 421), da die Karte die Abtrennung jetzt selbst übernimmt.

Keine Änderung an Logik, Daten oder Übersetzungen — rein visuell. Der Abstand zwischen den Karten entspricht dem bestehenden Karten-Rhythmus (`mt-4`/`mt-8` wie bei den Nachbar-Sektionen).

## Verifikation
- Typprüfung `bunx tsgo --noEmit`.
- Browser-Check: Admin → Bilder; Galerie erscheint als eigene Karte unterhalb der KI-Bilder-Karte, Suche und Blättern funktionieren.
