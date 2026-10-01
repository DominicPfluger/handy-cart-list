# Zutatenlisten im Rezept-Generator: 12er-Schritte

## Ziel
Im Rezept-Generator zeigt jeder Schritt seine Zutaten gestaffelt: 12 Einträge auf einmal, mit Knopf zum Aufklappen um jeweils 12 weitere. Kurze Listen bleiben komplett sichtbar.

## Regeln
- Liste mit **weniger als 18 Einträgen** → komplett anzeigen, kein Aufklapp-Knopf.
- Liste mit **18 oder mehr Einträgen** → initially **12** anzeigen; Knopf **„+12 weitere anzeigen"** blendet jeweils 12 weitere ein, bis alle sichtbar sind. Danach Knopf „Weniger anzeigen" zum Einklappen auf 12.
- Bereits ausgewählte Zutaten bleiben auch beim Einklappen sichtbar (bestehendes Verhalten bleibt erhalten).
- Betrifft alle Schritte aller Rezept-Kategorien (Brot, Belag, Käse, Kräuter & Gewürze, usw.).

## Technische Umsetzung
**Datei: `src/components/recipe-builder.tsx`** (einzige betroffene Komponente; das Admin-Panel bleibt unverändert)

- `LIMIT = 20` ersetzen durch `PAGE = 12` und `THRESHOLD = 18`.
- `expanded` (Record<string, boolean>) ersetzen durch `visibleCount` (Record<string, number>), Startwert 12.
- Anzeige-Logik pro Schritt:
  - `s.products.length < 18` → alle anzeigen, kein Knopf.
  - sonst: erste `visibleCount` Einträge + ausgewählte, die darüber liegen; Knopf „+N weitere anzeigen" (N = verbleibende Anzahl, max. 12) bzw. „Weniger anzeigen", wenn alles aufgeklappt ist.

**i18n: `src/i18n/de.ts` + `messages.json`**
- Neuer Schlüssel `rk.showMore`: „{count} weitere anzeigen ▾" — in alle 16 Sprachen übersetzt (de-DE in de.ts, 15 Lokalen in messages.json, wie üblich).
- `rk.showLess` bleibt unverändert; `rk.showAll` wird nicht mehr verwendet (Schlüssel kann bestehen bleiben).

## Test
- Build prüfen.
- In der Vorschau `/rezepte`: Kategorie mit langer Zutatenliste öffnen → 12 sichtbar, Knopf zeigt verbleibende Anzahl, zweimal aufklappen → alle sichtbar; kurze Liste (< 18) ohne Knopf; ausgewählte Zutat bleibt beim Einklappen sichtbar.
