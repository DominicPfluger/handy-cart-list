# Admin: «Liste als Text kopieren» mit Unterkategorien

## Ziel
Der bestehende Knopf «Liste als Text kopieren» im Admin-Katalog wird erweitert:
- Er erscheint immer, wenn eine Kategorie geöffnet ist — auch bei Unterkategorien ohne eigene Produkte (bisher nur bei direkten Produkten).
- Der kopierte Text enthält neu auch die Einträge aller Unterkategorien (rekursiv, alle Stufen), gruppiert nach Kategorie.

## Textaufbau (erweiterter Aufbau)
- Kopfzeile: Kategoriepfad wie bisher (`Ober › Unter › …`).
- Danach die direkten Produkte der geöffneten Kategorie wie bisher (Überschriften als `# …`-Zeilen, Aliasse ausgelassen).
- Danach für jede Unterkategorie (in Kachel-Reihenfolge, Alias-Kacheln ausgelassen) ein Absatz:
  - Leerzeile, dann `## Vollständiger Pfad › Unterkategorie` als Gruppenkopf
  - darunter je eine Zeile pro Produkt (nur Name, übersetzt via `p.nm`, Aliass-Produkte ausgelassen, in sort_order-Reihenfolge)
  - tiefer liegende Stufen genauso, rekursiv
- Beispiel:

```text
Obst & Gemüse › Beeren
# Frisch
Erdbeeren
Heidelbeeren

Obst & Gemüse › Beeren › Tiefkühl
## Obst & Gemüse › Beeren › Tiefkühl
Frozen Beeren Mix
```

## Änderungen

**1. `src/components/admin/catalog-tile-editor.tsx`**
- Button-Bedingung (ca. Zeile 369) von `p.cur && p.products.length > 0` auf `p.cur` ändern.
- `buildListText` wird zu einer async-Funktion `collectListText()`:
  - Aus `p.depts` die vollständige Nachfahren-Menge der geöffneten Kategorie berechnen (parent_id-Baum, rekursiv).
  - Für alle Nachfahr-Abteilungen in **einer** Supabase-Abfrage `products.select("id, name, sort_order, alias_id, department_id").in("department_id", ids)` laden (kein N+1).
  - Direkte Produkte wie bisher aus `p.products` (mit `# …`-Überschriften via `headingBefore`).
  - Für jede Unterkategorie (Reihenfolge wie `p.children`, Alias-Kacheln übersprungen) den Gruppenkopf `## Pfad` und deren Produkte anhängen; rekursiv in die nächste Stufe.
  - Produktreihenfolge in Unterkategorien nach `sort_order`, Fallback Name.
- Button-onClick: `const text = await collectListText(); if (text) { setText(text); setCopyOpen(true); }` — Text im State halten statt im Dialog berechnen; neuer State `copyText`.
- `CopyListDialog` bleibt unverändert (bekommt `title` + `text`).

**2. Übersetzungen**
- Keine neuen Schlüssel nötig: Knopf (`adm.copyList`), Dialogtitel (`adm.copyListTitle`), Kopierknopf (`share.copyText`) und Toasts (`export.copied` / `export.copyFailed`) existieren in allen 16 Sprachen.

Keine Datenbank- oder Backend-Änderung; nur eine zusätzliche Lese-Abfrage beim Öffnen des Dialogs.

## Prüfung
- `bunx tsgo --noEmit`, Build-Log prüfen.
- Browser-Test (Playwright): Admin → Katalog → Kategorie mit Unterkategorien und direkten Produkten öffnen → «Liste als Text kopieren» → Dialog zeigt Kopfzeile, direkte Produkte und gruppierte Unterkategorie-Abschnitte; Kopieren bestätigen (Textarea-Inhalt verifizieren); Kategorie ohne eigene Produkte, aber mit Unterkategorien zeigt ebenfalls den Knopf und liefert Text.
- roadmap.md ergänzen.
