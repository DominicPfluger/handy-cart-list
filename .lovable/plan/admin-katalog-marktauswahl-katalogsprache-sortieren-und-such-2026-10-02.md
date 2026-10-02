# Admin-Katalog: Marktauswahl, Katalogsprache, Sortieren und Suchen in einer Zeile

## Ziel
Im Admin-Tab „Katalog" stehen die vier Steuerungen kompakt nebeneinander in einer responsive Zeile, direkt unter der Pfadnavigation:

**Marktauswahl · Katalogsprache · Sortieren · Suchen**

Statt heute: Katalogsprache und Suche als je volle-Breite-Felder über dem Editor, Marktauswahl allein unter der Pfadnavigation, Sortierung ganz unten unter der Produktliste.

## Änderungen — nur `src/routes/_authenticated/admin.tsx` (+ Aufräumen in `catalog-tile-editor.tsx`)

1. **Eine gemeinsame Zeile** (`flex flex-wrap gap-2`) im Katalog-Tab, gerendert über dem Kachel-Editor (an der Stelle der bisherigen Sprache-/Suchfelder):
   - **Marktauswahl** (nur innerhalb einer Kategorie, wie bisher): Select „Global / Land", inkl. Hinweistext darunter wenn ein Markt gewählt ist.
   - **Katalogsprache**: bestehender `viewLoc`-Select, kompakt statt voller Breite.
   - **Sortieren**: bestehende Sortier-Auswahl (Relevanz / Preis / Alphabet / Ähnlichkeit) + „Sortieren"-Knopf — nur wenn die Kategorie mehr als ein Produkt hat, wie bisher.
   - **Suchen**: bestehendes Suchfeld (durchsucht weiterhin deutscher Name + alle Übersetzungen).
2. **Responsive Breiten:** Jedes Feld `flex-1 min-w-[10rem]`, Höhe einheitlich (h-11), damit auf dem Handy zwei Zeilen (2 × 2) entstehen und auf Tablet/Desktop alle vier in einer Reihe stehen.
3. **Reihenfolge im Suchmodus:** Bei eingegebener Suche erscheinen die Suchtreffer wie bisher direkt unter der Zeile; der Kachel-Editor bleibt ausgeblendet, bis die Suche geleert ist.
4. **Aufräumen:** `toolbar`- und `sortControls`-Props werden nicht mehr übergeben; die zugehörigen Renderstellen und Props in `src/components/admin/catalog-tile-editor.tsx` werden entfernt (`below` für die Aliase bleibt).
5. Alles andere (Statistiken, „Übersetzungen ergänzen", Add-Buttons, Kacheln, Bulk-Formular, Editor-Dialog) bleibt unverändert.

## Verifikation
- Build prüfen.
- Playwright in der Vorschau: /admin öffnen (Login via setSession), Kategorie öffnen — eine Zeile mit Markt-, Sprach-, Sortier- und Suchfeld unter der Pfadnavigation; Sortierung nicht mehr am Listenende; Suche liefert weiterhin Treffer aus Übersetzungen; schmale Viewport (390 px) zeigt 2 × 2-Umbruch.
