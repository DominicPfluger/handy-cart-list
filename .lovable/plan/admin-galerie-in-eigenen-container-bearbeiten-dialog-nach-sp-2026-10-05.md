# Admin: Galerie in eigenen Container + Bearbeiten-Dialog nach Speichern schliessen

## 1. Bildergalerie in separaten Container (Tab «Bilder»)
In `src/components/admin/catalog-media-panel.tsx` wird `<ImageGallery />` (ca. Zeile 269) noch innerhalb derselben `<section>`-Karte wie die KI-Bild-Generierung gerendert — nur durch eine Trennlinie abgesetzt.

Änderung:
- `<ImageGallery />` aus der «Bilder»-Sektion herausnehmen und als eigene Karte darunter rendern:
  ```jsx
  <section className="mt-4 rounded-2xl border border-border bg-card p-4">
    <ImageGallery />
  </section>
  ```
- In der `ImageGallery`-Komponente die Trennlinien-Klassen `mt-5 border-t border-border pt-4` (Zeile 421) entfernen — die Karte übernimmt die Abtrennung.

## 2. Produkt-Bearbeiten-Dialog nach Speichern automatisch schliessen
In `src/routes/_authenticated/admin.tsx` bleibt der Editor-Dialog («Produkt bearbeiten», Zeilen 920–959) nach dem Speichern derzeit offen; `run` zeigt nur einen Toast an.

Änderung:
- Im `onSave`-Handler der `Editor`-Instanz nach dem erfolgreichen Speichern (`await must(...)` etc., am Ende der `run`-Callback-Funktion) `setSel(null)` aufrufen — aber nur für `sel.kind === "product"`, damit der gleiche Dialog für Kategorien/Überschriften unverändert offen bleibt.
- Bei einem Fehler (Throw in `run`) bleibt der Dialog offen — Schliessen passiert erst nach erfolgreichem Speichern.

Keine Übersetzungen, keine Datenänderungen — beides rein visuelles/Verhaltens-Feintuning.

## Verifikation
- Typprüfung `bunx tsgo --noEmit`.
- Browser-Check: Admin → Bilder (Galerie als eigene Karte, Suche/Blättern works); Admin → Katalog → Produkt bearbeiten → Speichern (Dialog schliesst, Toast erscheint); Kategorie bearbeiten → Speichern (Dialog bleibt offen).
