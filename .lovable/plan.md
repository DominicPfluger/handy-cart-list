# Icons für alle Produkte ohne Listen-Icon

## Ausgangslage
Über 900 Produkte haben kein Icon (`products.emoji` ist leer) und erscheinen in der Listenansicht nur mit einem Punkt. Betroffen sind u. a. Fruchtsirupe (64), Fruchtkonserven (38), Getreide (37), Lamm (30), Fisch (29) und viele weitere Kategorien.

## Vorgehen
1. **KI-Vergabe pro Produkt:** Eine neue Server-Funktion (nach dem Muster der bestehenden Übersetzungs-/Vorschlagsfunktionen) schickt die Produktnamen ohne Icon in Paketen von ca. 100 an die KI und lässt je ein passendes Emoji vergeben (z. B. Lammkeule → 🍖, Apfelsaft → 🧃).
2. **Speichern:** Die Ergebnisse werden direkt in `products.emoji` geschrieben (nur leere Felder, vorhandene Icons bleiben unberührt).
3. **Aufruf:** Einmalig von mir ausgelöst (Admin-Server-Funktion mit Rechteprüfung), in mehreren Durchläufen bis alle Produkte ein Icon haben.
4. **Fallback:** Produkte, für die die KI nichts Sinnvolles liefert, erhalten das Icon ihrer Kategorie.

## Technische Details
- Neues `assignProductEmojis` in `src/lib/admin.functions.ts` (Admin-Prüfung wie bei `suggestProducts`), Batch-Update auf `products.emoji`.
- Keine Schemaänderung, keine Übersetzungen nötig (Emojis sind sprachneutral).
- Bestehende Icons (z. B. 💧 bei Wasser) werden nicht überschrieben.

## Prüfung
- Danach zähle ich verbleibende Produkte ohne Icon (Ziel: 0) und kontrolliere Stichproben in der Vorschau.
