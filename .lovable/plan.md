# Klick auf Produkt-Icon öffnet den Bearbeiten-Dialog

## Ausgangslage
In der Kachel-Ansicht des Admin-Panels öffnet zurzeit nur ein Klick auf den **Text** eines Produkts den Produktbearbeitungs-Dialog. Ein Klick auf das **Icon/Bild** links daneben tut nichts — das Bild erscheint nur per Doppelklick vergrössert. Das ist ungewohnt, weil das Icon die auffälligste Fläche der Zeile ist.

## Änderung
Ein einzelner Klick auf das Produkt-Icon (Bild oder Emoji) öffnet denselben Dialog wie ein Klick auf den Text:

- **Eigenes Produkt:** der Produktbearbeitungs-Dialog (ItemSheet) öffnet sich.
- **Alias-Produkt:** es öffnet sich wie bisher das Originalprodukt (gleiche Behandlung wie beim Text-Klick).

Bewahrt bleibt:
- **Ziehen** des Icons per Griff startet weiterhin Drag & Drop (der bestehende Klick-Schutz `moved.current` verhindert, dass nach einem Ziehen ein Dialog aufgeht).
- **Doppelklick** auf das Icon vergrössert weiterhin das Bild.

Technisch: Im `catalog-tile-editor.tsx` bekommt das Icon-`<span>` der Produktzeilen (Zeile ~340) einen `onClick`-Handler über die bestehende `click(...)`-Hilfsfunktion mit derselben Logik wie der Text-Button (`alias_id` → `onAdvanced`, sonst `setTarget({ kind: "product", id })`).

## Umfang
- Nur Produktzeilen in der Kachel-Ansicht; Kategorien bleiben unverändert.
- Keine Datenbank- oder i18n-Änderung nötig.

## Prüfung
- Browser-Test: Klick auf Produkt-Icon öffnet den Dialog; Doppelklick zeigt das Bild gross; Ziehen des Icons verschiebt das Produkt, ohne den Dialog zu öffnen.
