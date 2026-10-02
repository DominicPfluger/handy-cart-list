# Admin: Vorschau-Knopf in der Tab-Leiste und eigener Tab „Märkte"

## Was sich ändert
- **Neuer Tab „Märkte"** (vor „Mehr"): enthält „Märkte verwalten" (Länder + Supermärkte) und „Markt-Admins verwalten". Beide verschwinden aus „Mehr"; dort bleiben die übrigen Optionen (z. B. Vorlese-Texte).
- **„👁 Vorschau" in der Tab-Leiste**, direkt rechts neben „Mehr". Ein Tipp öffnet den Katalog im Handy-Rahmen wie in der App-Abteilungsansicht – von jedem Tab aus. Der Vorschau-Knopf in der Aktionszeile des Katalogs entfällt (keine Doppelung).

Neue Tab-Reihenfolge:
```text
Katalog · Rezepte & Küchen · Sprachen · Bilder · Preise · Import · Märkte · Mehr · 👁 Vorschau
```

## Technische Details
- `src/routes/_authenticated/admin.tsx`: Tab-Typ um `"markets"` erweitern, Eintrag `["markets","adm.tab.markets"]` vor `more`; `MarketsManager` + `MarketAdminsManager` in den neuen Zweig verschieben. Nach der Tab-Liste einen Knopf (gleicher Stil wie Tabs, aber als Aktion) rendern, der `preview`-State setzt; Vorschau-Overlay (iframe `/abteilungen`, Handy-Rahmen) aus `catalog-tile-editor.tsx` in eine kleine Komponente `src/components/admin/catalog-preview.tsx` auslagern und in admin.tsx einbinden.
- `catalog-tile-editor.tsx`: Vorschau-Knopf und Overlay entfernen.
- i18n: `adm.tab.markets` („Märkte") prüfen/ergänzen in de.ts + allen 15 Locales (Schlüssel existierte evtl. schon vom früheren Märkte-Tab). `tile.preview` wird weiterverwendet.
- Keine Datenbankänderung.

## Prüfung
Build prüfen; in der Vorschau Tab „Markets" öffnen (Länderliste + Markt-Admins sichtbar), „More" ohne diese Bereiche, Vorschau-Knopf neben „More" öffnet den Handy-Rahmen.
