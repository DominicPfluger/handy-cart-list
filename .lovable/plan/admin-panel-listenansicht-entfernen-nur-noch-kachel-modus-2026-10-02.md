# Admin-Panel: Listenansicht entfernen — nur noch Kachel-Modus

## Ziel
Im Admin-Bereich (Tab „Katalog") verschwindet die Listenansicht komplett. Kategorien, Überschriften, Produkte, „Mehrere Produkte" und „Vorschläge" werden ausschliesslich im Kachel-Modus angezeigt, hinzugefügt, bearbeitet und gelöscht. Der Umschalter „Liste / Kacheln" entfällt.

## Was entfernt wird (nur in `src/routes/_authenticated/admin.tsx`)
1. **Umschalter „Liste / Kacheln"** (Segment-Buttons über dem Suchfeld) samt `view`-State — der Katalog-Tab rendert immer `CatalogTileEditor`.
2. **Der komplette Listen-Zweig** (aktuell Zeilen ~399–533): Breadcrumb-Navigation, Werkzeugleiste („+ Kategorie / + Überschrift / + Produkt / + Mehrere Produkte / ✨ Vorschläge"), `AddForm`, Kategorie-/Produktzeilen mit ▲▼✎, Überschriften-Ziehen in der Liste, Relevanz-Knopf der Liste.
3. **Nur dort benutzter Code**: `Row`- und `AddForm`-Komponenten, `drag`/`dropIndex`-Hilfszustand, `adding`-State, `move`-Hilfsfunktion. Nicht verwendete i18n-Schlüssel (z. B. `tile.viewList`, `adm.rowSub`, `adm.sortBy`, `adm.opt.*`) bleiben unangetastet — keine Risikoänderung an Übersetzungen.
4. `shoppi:admin-tiles`-Event wird immer mit `detail: true` gesendet (untere Menüleiste bleibt im Katalog-Tab ausgeblendet wie bisher im Kachel-Modus).

## Funktionen, die in die Kachelansicht wandern
1. **Markt-Auswahl** (Global / Land) oben im Kachel-Editor — Reihenfolge, Verfügbarkeit („im Markt nicht erhältlich") und Richtpreise richten sich danach.
2. **Weitere Sortierungen**: Statt nur „Nach Relevanz sortieren" eine Auswahl Relevanz / Preis / Alphabet / Ähnlichkeit plus Knopf „Sortieren" (bestehende Sortier-Logik).
3. **Aliase als Kacheln**: Einträge, die zusätzlich in dieser Kategorie erscheinen, werden als Kacheln mit kleinem Verknüpfungs-Hinweis (🔗) angezeigt; Tipp öffnet das Original zum Bearbeiten.
4. **Erweiterte Bearbeitung**: Im Bearbeiten-Fenster der Kachel ein Knopf „Erweitert", der den bisherigen vollständigen Editor öffnet — Übersetzungen pro Sprache, Neu-Übersetzen, Ernährungsfilter, Varianten, Marken, Aliase, Kategorie-Bild, in andere Kategorie verschieben.

## Was sonst erhalten bleibt
- **Pfadnavigation** (Katalog › Kategorie › Unterkategorie) bleibt — die Kachelansicht zeigt sie bereits oben.
- **„+ Mehrere Produkte" / „✨ Vorschläge"** öffnen wie bisher das Bulk-Formular aus dem Kachel-Editor.
- **Suche**: Treffer springen in die passende Kategorie der Kachelansicht und öffnen die erweiterte Bearbeitung.
- Alle anderen Tabs (Rezepte & Küchen, Bilder, Preise, Import, Märkte, Sprachen, Mehr) bleiben unberührt.

## Verifikation
- Build fehlerfrei; toter Code (State, Komponenten) verursacht keine Warnungen.
- Playwright-Check im Admin (Login via bestehendem Skript-Muster): Tab „Catalog" zeigt nur den Kachel-Editor, kein „List/Tiles"-Umschalter, keine Listenzeilen; „+ Multiple products"-Kachel, Marktauswahl und Suche funktionieren.
