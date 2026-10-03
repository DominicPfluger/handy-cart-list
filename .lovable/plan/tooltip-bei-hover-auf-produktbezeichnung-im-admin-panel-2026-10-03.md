# Tooltip bei Hover auf Produktbezeichnung im Admin-Panel

## Ziel
In der Produktauflistung des Admin-Panel-Kachel-Editors zeigt der Produktname bei Mouse-Over den vollständigen Namen als Tooltip, wenn er abgeschnitten ist (Truncate).

## Umsetzung
In `src/components/admin/catalog-tile-editor.tsx` (Produktzeile, Zeile ~459):

- Der Produktname-`<div>` erhält ein `title`-Attribut mit dem vollen (evtl. übersetzten) Namen: `title={p.nm(pid, x.name)}`.
- Keine weiteren Änderungen — Layout, Bearbeiten-Buttons und Bestätigungsfragen bleiben unverändert.
