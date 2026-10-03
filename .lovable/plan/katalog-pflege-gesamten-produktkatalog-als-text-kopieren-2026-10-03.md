# Katalog-Pflege: Gesamten Produktkatalog als Text kopieren

## Ziel
Im Admin-Bereich „Katalog-Pflege" gibt es einen neuen Knopf „Katalog als Text kopieren". Er öffnet einen Dialog, der den gesamten Produktkatalog als reinen Text zeigt (ohne Emojis/Icons) und per Knopfdruck in die Zwischenablage kopiert.

## Textaufbau
- Aufbau nach Kategorie-Baum in der Katalog-Reihenfolge (sort_order):
  - Oberkategorien als Zeile `# Kategoriename`
  - Unterkategorien als Zeile `## Oberkategorie › Unterkategorie`
  - Darunter je eine Zeile pro Produkt (nur Name, keine Emojis, keine Aliasse)
- Namen in der aktuell gewählten Admin-Sprache (Übersetzungen aus `tr`, sonst Basisname)
- Beispiel:

```text
# Obst & Gemüse
## Obst & Gemüse › Fruchtgemüse
Paprika
Tomaten
# Haushalt
## Haushalt › Reinigung
Spülmittel
```

## Umsetzung

**1. `src/components/admin/catalog-health-panel.tsx`**
- Neuer Knopf „Katalog als Text kopieren" oben im Panel (neben den bestehenden Aktionen), öffnet Dialog.
- Neue Funktion `buildCatalogText()`: baut den Kategorie-Baum aus `depts` (parent_id), läuft rekursiv in sort_order-Reihenfolge (Fallback: Name), schreibt `#`-/`##`-Zeilen und Produkte aus `prods` (nach sort_order, Fallback Name); Übersetzte Namen über `tr.get(id)?.[locale]` mit Fallback auf `name`. Locale aus `useT()`.
- Neuer Dialog `CatalogTextDialog` (gleiches Muster wie `CopyListDialog` im Kachel-Editor: Overlay + Card, Überschrift, mehrzeiliges schreibgeschütztes Textfeld, Knopf „Text kopieren" mit `navigator.clipboard.writeText` + Toast `export.copied` / `export.copyFailed`, Knopf „Abbrechen" `adm.cancel`).

**2. Übersetzungen**
- `src/i18n/de.ts`: neuer Schlüssel `adm.copyCatalog` = „Katalog als Text kopieren" und `adm.copyCatalogTitle` = „Gesamter Katalog".
- `src/i18n/messages.json`: dieselben Schlüssel in den 15 weiteren Sprachen (en: „Copy catalog as text" / „Entire catalog", es/fr/it/pt/nl/de-AT/de-CH sinngemäss).
- Kopier-Knopf und Toasts nutzen bestehende Schlüssel (`share.copyText`, `export.copied`, `export.copyFailed`).

Keine Datenbank- oder Backend-Änderung; der Text entsteht aus den bereits geladenen Admin-Daten.

## Prüfung
- Typprüfung und Build.
- Browser-Test: Admin → Katalog-Pflege → Knopf öffnet Dialog, Text enthält Kategorien und Produkte, Kopieren funktioniert, Dialog schliesst.
- roadmap.md ergänzen.
