# Plan: Leere Kategorien — Klick springt zur Kategorie im Kachelmodus

## Ausgangslage (geprüft)

- „Leere Kategorien" ist eine Karte im Bereich „Datenlücken" des Pflege-Tabs
  (`CatalogHealthPanel`, src/components/admin/catalog-health-panel.tsx, Karte `emptyDepts`).
  Die Einträge dort sind reine Textzeilen ohne Aktion.
- Der Kachelmodus ist der Katalog-Tab der Admin-Seite: Die angezeigte Kategorie wird
  über den State `cur` gesteuert (`setCur`), der Tab über `tab` (src/routes/_authenticated/admin.tsx,
  Zeilen 114/123; Einbindung `CatalogTileEditor` Zeile 803; `CatalogHealthPanel` Zeile 916).

## Umsetzung

1. **catalog-health-panel.tsx**
   - Neuer optionaler Prop `onOpenDept?: (deptId: string) => void`.
   - Im Typ der Karten-Einträge ein optionales `deptId` ergänzen; die Einträge der Karte
     „Leere Kategorien" liefern `deptId: d.id`.
   - In der Aufklappliste: Bei Einträgen mit `deptId` ist die Zeile klickbar (Button)
     und ruft `onOpenDept(deptId)` auf — daneben bleibt der bestehende „Öffnen"-Knopf
     für Produkte unverändert. Pfeil/Hinweis-Icon deutet den Sprung an.

2. **admin.tsx (Zeile 916)**
   - Prop übergeben:
     `onOpenDept={(id) => { setSearch(""); setSel(null); setCur(id); setTab("catalog"); }}`
     — wechselt in den Katalog-Tab (Kachelmodus) und öffnet dort die gewählte
     (leere) Kategorie, Produkte/Suche zurückgesetzt.

Keine Datenbank- oder i18n-Änderungen nötig (Text „Öffnen" existiert bereits).

## Verifikation

- Typprüfung und Build fehlerfrei.
- Browser-Test als Admin: Pflege → Datenlücken → „Leere Kategorien" aufklappen,
  Zeile anklicken → Ansicht wechselt in den Kachelmodus der gewählten Kategorie
  (Breadcrumb/Pfad stimmt, Kategorie ist leer).
