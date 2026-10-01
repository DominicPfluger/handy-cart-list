# Drag & Drop für Rezept-Zutaten im Admin-Panel

## Ziel
Im Admin-Panel unter „Rezept-Zutaten" lassen sich die Zutaten eines Schritts (z. B. „Belag", „Basis") per Drag & Drop umsortieren — statt nur mit den ▲▼-Pfeilen.

## Was gebaut wird

### Drag & Drop in der Zutaten-Liste eines Schritts
- Jede Zutaten-Zeile bekommt einen **Zieh-Griff (⠿)** am linken Rand — wie im Katalog-Bereich des Admin-Panels.
- Beim Ziehen über eine andere Zeile erscheint eine **Drop-Linie** (oberhalb/unterhalb), die anzeigt, wo die Zutat landet.
- Beim Loslassen wird die neue Reihenfolge **sofort gespeichert** (Sortiernummern aller betroffenen Zeilen des Schritts werden aktualisiert) und gilt für alle Nutzer im Rezept-Ersteller.
- Verschieben ist nur **innerhalb desselben Schritts** möglich (z. B. nur innerhalb „Belag") — Zutaten zwischen Schritten verschieben bleibt über Abhaken/Hinzufügen gelöst.
- **Firefox-kompatibel:** `setData` im dragstart, `preventDefault` beim Drop.
- Die **▲▼-Pfeile bleiben** zusätzlich erhalten (für Touch-Geräte ohne Maus).

## Technische Details
- Datei: `src/components/recipe-admin.tsx`
- Muster aus `src/routes/_authenticated/admin.tsx` (Row-Komponente mit Drag-Griff, Drop-Linie top/bottom) wird auf die Zutaten-Zeilen übertragen
- Persistierung: bestehende `recipe_ingredients.sort_order`-Updates per Supabase-Client (RLS: nur Admins), danach Query-Neuladen wie bei `move`
- Keine Datenbank-Änderungen nötig
