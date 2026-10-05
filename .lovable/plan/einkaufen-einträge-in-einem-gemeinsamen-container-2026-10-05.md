# Einkaufen-Einträge in einem gemeinsamen Container

Unter „Mehr" → Einkaufen stehen „Gewünschte Ernährungsform", „Abteilungen ordnen & umbenennen" und „Ausgeblendete Produkte" heute in drei getrennten Karten. Neu erscheinen sie in **einer** Karte, durch feine Trennlinien voneinander abgesetzt — wie die übrigen Gruppen.

## Technische Details
- `src/routes/mehr.tsx`: die drei `<section>`-Blöcke (Zeilen ~125–167) zu einer `<section className="divide-y divide-border rounded-2xl border border-border bg-card">` zusammenführen; Inhalte unverändert, nur innere Wrapper ohne eigenen Rahmen.
- Keine Text-, Logik- oder Datenänderungen.
