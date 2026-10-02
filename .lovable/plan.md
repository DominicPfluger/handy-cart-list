# Admin-Panel: Listenansicht entfernen — nur noch Kachel-Modus

## Ziel
Im Admin-Bereich (Tab „Katalog") verschwindet die Listenansicht komplett. Kategorien, Überschriften, Produkte, „Mehrere Produkte" und „Vorschläge" werden ausschliesslich im Kachel-Modus angezeigt, hinzugefügt, bearbeitet und gelöscht. Der Umschalter „Liste / Kacheln" entfällt.

## Was entfernt wird (nur in `src/routes/_authenticated/admin.tsx`)
1. **Umschalter „Liste / Kacheln"** (Segment-Buttons über dem Suchfeld) samt `view`-State — der Katalog-Tab rendert immer `CatalogTileEditor`.
2. **Der komplette Listen-Zweig** (aktuell Zeilen ~399–533): Breadcrumb-Navigation, Werkzeugleiste („+ Kategorie / + Überschrift / + Produkt / + Mehrere Produkte / ✨ Vorschläge"), `AddForm`, Kategorie-/Produktzeilen mit ▲▼✎, Überschriften-Ziehen in der Liste, Relevanz-Knopf der Liste.
3. **Nur dort benutzter Code**: `Row`- und `AddForm`-Komponenten, `drag`/`dropIndex`-Hilfszustand, `adding`-State, `move`-Hilfsfunktion. Nicht verwendete i18n-Schlüssel (z. B. `tile.viewList`, `adm.rowSub`, `adm.sortBy`, `adm.opt.*`) bleiben unangetastet — keine Risikoänderung an Übersetzungen.
4. `shoppi:admin-tiles`-Event wird immer mit `detail: true` gesendet (untere Menüleiste bleibt im Katalog-Tab ausgeblendet wie bisher im Kachel-Modus).

## Was erhalten bleibt (auch nach dem Umbau erreichbar)
- **Markt-Auswahl**: Das Auswahlfeld „Global / Markt" steht künftig direkt über dem Kachel-Editor, damit marktspezifische Reihenfolge und Richtpreise weiterhin gewählt werden können (bisher stand es nur in der Liste).
- **„+ Mehrere Produkte" / „✨ Vorschläge"**: Bulk-Formular wird wie bisher vom Kachel-Editor geöffnet (`onBulkAdd` + `BulkAddForm`) — unverändert.
- **Suche**: Suchtreffer öffnen weiterhin den bestehenden Editor-Dialog (Varianten, Ernährungsfilter, Übersetzungen, Marken, Bilder).
- **Alias-Zeilen** (Abteilungs-/Produkt-Aliase) erscheinen weiterhin unter dem Kachel-Editor, da es dafür im Kachel-Modus keine eigene Oberfläche gibt.
- **Editor-Dialog** (`Editor`, inkl. Löschen, Neu-Übersetzen) bleibt — er wird von Suche und Alias-Zeilen geöffnet.
- Alle anderen Tabs (Rezepte & Küchen, Bilder, Preise, Import, Märkte, Sprachen, Mehr) bleiben unberührt.

## Verifikation
- Build fehlerfrei; toter Code (State, Komponenten) verursacht keine Warnungen.
- Playwright-Check im Admin (Login via bestehendem Skript-Muster): Tab „Catalog" zeigt nur den Kachel-Editor, kein „List/Tiles"-Umschalter, keine Listenzeilen; „+ Multiple products"-Kachel, Marktauswahl und Suche funktionieren.
