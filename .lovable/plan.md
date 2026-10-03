# Admin-Katalog: Zieh-Griff, Stift und Papierkorb an Produktzeilen

## Ziel
Im Admin-Panel im Katalog erscheinen bei jedem Produkt in der Liste drei Icons direkt links neben dem Produktbild:

1. **Zieh-Griff (⠿)** — Produkt per Drag & Drop verschieben (bisher startet das Ziehen vom Bild selbst, was mit dem Bild-Klick kollidiert).
2. **Stift** — öffnet den bestehenden Produkt-Bearbeiten-Dialog („Erweitert").
3. **Papierkorb** — löscht das Produkt mit der bestehenden Bestätigungsfrage.

## Umsetzung
Datei: `src/components/admin/catalog-tile-editor.tsx`, Produktzeilen (ca. Zeile 409–425):

- Vor dem Produktbild ein Zieh-Griff-Span einfügen, der `startDrag(...)` samt der Drag-Handler übernimmt (inkl. bestehender Mehrfachauswahl-Logik „+n" und Alias-Start). Das Bild selbst verliert `onPointerDown`/Drag — Klick (Bilddialog) und Doppelklick (Zoom) bleiben.
- Neben dem Bild zwei Icon-Buttons im Stil des Rezepte-Admins (`variant="ghost" size="icon"`, `h-6 w-6`, Pencil/Trash2 aus lucide-react):
  - Stift: onClick = `p.onAdvanced("product", pid)` (bei Aliassen ebenfalls) — disabled, wenn der Bearbeiten-Modus aus ist (wie der Produktname heute).
  - Papierkorb: onClick = `p.remove("product", x.id, p.nm(pid, x.name))` — die bestehende Funktion fragt bereits nach („Löschen: Name?"); ebenfalls im Bearbeiten-Modus deaktiviert.
- Abteilungs-Kacheln, Überschriften und Alias-Zeilen bleiben unverändert.

## Prüfung
- Typprüfung (`tsgo --noEmit`).
- Browser-Test: Produkt per Zieh-Griff verschieben (Reihenfolge speichert sich in der DB), Stift öffnet den Bearbeiten-Dialog, Papierkorb fragt nach und löscht (mit Testprodukt, danach wieder aufräumen).
- roadmap.md ergänzen.
