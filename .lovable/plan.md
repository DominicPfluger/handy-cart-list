# Länderküchen per Drag & Drop sortieren

## Ziel
Im Admin-Panel unter „Rezepte & Küchen" lassen sich die Länderküchen in der Liste per Drag & Drop verschieben. Die ▲/▼-Knöpfe verschwinden.

## Umsetzung (nur src/components/cuisine-admin.tsx)

**Entfernen:**
- Die ▲/▼-Buttons pro Zeile (Zeilen 147–148) und die Funktion `move` (Zeilen 123–129).

**Hinzufügen:**
- HTML5 Drag & Drop auf den Küchen-Zeilen (gleiches Muster wie die Varianten im Produkt-Bearbeiten-Dialog):
  - Griff ⠿ links in jeder Zeile; Zeile ist `draggable`.
  - `onDragStart` merkt den Start-Index, `onDragOver` (preventDefault) markiert die Zielzeile visuell (z. B. `border-primary bg-primary/10`), `onDrop` sortiert das lokale Array um und speichert sofort.
  - Nach dem Drop: alle `sort_order`-Werte (0, 1, 2, …) in der Datenbank speichern (gleiche Logik wie bisher in `move`), danach `admin-cuisines` und `catalog` invalidieren — über die bestehende `run`-Hilfsfunktion mit Fehleranzeige/Toast.
- Klick auf den Küchennamen öffnet weiterhin die Detail-Ansicht (unverändert).

## Nicht geändert
- Der Pfeil ▼/▲ in der Titelzeile zum Auf- und Zuklappen des Bereichs bleibt.
- Anlegen, Bearbeiten, Löschen, Zuweisen und KI-Vorschläge bleiben wie sie sind.
- Keine Datenbank- oder i18n-Änderung (Schlüssel `adm.up`/`adm.down` bleiben ungenutzt in den Sprachdateien).

## Prüfung
- Build fehlerfrei.
- Im Preview: Im Tab „Rezepte & Küchen" den Bereich „Länderküchen" aufklappen, eine Küche am Griff an eine andere Position ziehen — neue Reihenfolge erscheint und bleibt nach dem Neuladen erhalten.
