# Pflege: Suche + KI-Optionen bei „Produkte ohne Bild"

## Was sich ändert

Im Admin unter „Pflege" → „Produkte ohne Bild":

1. **Suchfunktion**: Ein Suchfeld neben dem Filter-Dropdown. Es filtert die Liste live nach Produktname (und Kategorie-Pfad), Gross-/Kleinschreibung egal. Bei neuer Suche springt die Anzeige wieder auf die ersten 5 Treffer; „Weitere 5 laden" funktioniert auch innerhalb der Suche.

2. **KI-Optionen beim Klick auf den Zauberstab**: Statt zwei getrennter Zauberstab-Knöpfe pro Zeile gibt es nur noch einen. Ein Klick darauf öffnet ein kleines Auswahlmenü mit den beiden bisherigen Optionen:
   - „Bild erzeugen (Icon ableiten)" — 1 KI-Bild, Icon wird daraus erstellt
   - „Beide Bilder separat mit KI" — 2 KI-Bilder (grosses Bild + eigenes Icon)
   
   Die Wahl startet die Erzeugung sofort. Der Stapel-Lauf („Alle n mit KI erzeugen") mit seinem Modus-Dropdown bleibt unverändert.

## Technische Details

- `src/components/admin/missing-images-panel.tsx`:
  - Neuer State `query`; `missing`-Filterung um Namens-/Pfad-Match erweitert; `setLimit(PAGE)` bei Suchänderung.
  - Die zwei Buttons (Wand2 / WandSparkles) werden zu einem Button mit kleinem Popover-Menü (absolut positioniert, Klick ausserhalb schliesst); Menüpunkte rufen `fix(p)` bzw. `fix(p, true)`.
- i18n: neuer Schlüssel `adm.noImg.search` (Platzhalter „Suchen…") in `src/i18n/de.ts` und allen 15 Locales in `messages.json`; vorhandene Schlüssel `adm.noImg.gen`/`genBoth` werden als Menütexte wiederverwendet.
- Kein Server-/Datenbank-Eingriff.

## Prüfung

- Typprüfung + Build.
- Browser-Test im Admin → Pflege: Suche filtert live, Zauberstab-Menü öffnet sich, beide Optionen starten die Erzeugung.
