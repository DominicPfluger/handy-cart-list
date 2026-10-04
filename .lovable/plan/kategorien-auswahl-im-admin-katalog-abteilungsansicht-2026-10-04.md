# Kategorien-Auswahl im Admin-Katalog (Abteilungsansicht)

## Ziel
Im Admin-Panel → Tab „Katalog" erhält die Werkzeugleiste ein Kategorien-Dropdown zum direkten Sprung in jede Kategorie. Es steht **zwischen dem Sortieren-Block (Dropdown + ↕-Knopf) und dem Suchfeld**.

## Umsetzung
Nur `src/routes/_authenticated/admin.tsx`:

1. **Neues Dropdown in der Werkzeugleiste** (nach dem Sortieren-Block, vor dem Such-Input):
   - Wert = aktuell gewählte Kategorie (`cur`), erste Option „Alle Kategorien" (Wurzel).
   - Optionen: alle Kategorien in **Baum-Reihenfolge der Abteilungsansicht** (Helper `deptTreeOrder` aus `src/lib/dept-order.ts`, analog zum Kategorienfilter in „Pflege → Produkte ohne Bild") mit Pfad-Beschriftung „Frischmarkt › Gemüse" (bestehender Helper `path()` + `nm()`).
   - Bei Auswahl: `setCur(id)`, Auswahl/Editor-Dialog zurücksetzen, Suchfeld leeren (damit die Trefferliste die Kachelansicht nicht verdeckt).
   - `aria-label` „Kategorien" (bestehender Schlüssel `adm.categories`), Root-Option Schlüssel `adm.noImg.cat` („Alle Kategorien").

2. **Keine neuen i18n-Schlüssel** — vorhandene Schlüssel decken alles ab.

## Verifikation
- Typprüfung und Build fehlerfrei.
- Browser-Test als Admin: Dropdown erscheint zwischen ↕-Knopf und Suchfeld, zeigt die Kategorien in Abteilungs-Reihenfolge; Auswahl springt in die Kategorie (Breadcrumb + Kacheln aktualisiert), „Alle Kategorien" springt zurück zur Wurzel.
