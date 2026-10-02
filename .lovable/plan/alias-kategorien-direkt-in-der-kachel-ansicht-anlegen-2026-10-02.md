# Alias-Kategorien direkt in der Kachel-Ansicht anlegen

## Ziel
Im Admin-Panel kannst du in der Kachel-Ansicht einer geöffneten Kategorie direkt eine **Alias-Kategorie** hinzufügen: eine bestehende Kategorie, die zusätzlich an dieser Stelle angezeigt wird — ohne erst den Bearbeiten-Dialog der anderen Kategorie öffnen zu müssen.

## Was sich ändert

1. **Neuer Knopf „Alias-Kategorie"** in der Kachel-Ansicht, neben „Neue Kategorie" / „Neues Produkt".
2. **Auswahl-Dialog**: Liste aller bestehenden Kategorien (mit Suchfeld). Ausgeschlossen sind:
   - die gerade geöffnete Kategorie selbst und ihre Unterkategorien (sonst Endlosschleife),
   - Kategorien, die hier bereits als Alias liegen.
3. **Anzeige in der Kachel-Liste**: Alias-Kategorien erscheinen wie in der App an ihrer Position in der Liste — mit gestricheltem Rahmen und „· Alias"-Hinweis, analog zu den Alias-Produkten.
4. **Drag & Drop**: Alias-Kategorien lassen sich wie normale Kategorien und Produkte an eine neue Position ziehen; die Reihenfolge wird gespeichert.
5. **Entfernen**: per ✕ am Alias-Eintrag — nur die Verknüpfung wird gelöscht, die Kategorie selbst bleibt erhalten (mit Bestätigung).
6. **Die bisherige separate Alias-Liste** unterhalb der Kacheln (mit ▲/▼-Pfeilen) entfällt, weil die Aliase jetzt direkt in der Liste liegen.
7. Beschriftungen in allen vorhandenen App-Sprachen ergänzen.

## Technische Umsetzung
- `src/routes/_authenticated/admin.tsx`: Alias-Kategorien der aktuellen Kategorie laden und wie die Alias-Produkte in die Kachel-Liste einmischen (`id: "deptalias:<aliasId>"`); Reihenfolge-Speicherung um `department_aliases.sort_order` erweitern; neuer Auswahl-Dialog mit Suche; Insert in `department_aliases` mit `sort_order` am Listenende.
- `src/components/admin/catalog-tile-editor.tsx`: neuer Knopf in der Aktionsleiste; Alias-Kategorien im Drag & Drop und Rendern wie Alias-Produkte behandeln (gestrichelter Rahmen, ✕ entfernt nur den Alias, Klick öffnet die Original-Kategorie).
- `src/components/dept-alias-admin.tsx`: `DeptAliasRows` aus der Admin-Seite entfernen; `DeptAliasEditor` im Kategorie-Dialog bleibt bestehen.
- `src/i18n/de.ts` + `src/i18n/messages.json`: neue Texte (z. B. „Alias-Kategorie", „Kategorie als Alias hinzufügen") in allen Sprachen.
- Keine Datenbank-Änderung nötig — `department_aliases` existiert bereits.

## Prüfung
- Build und Typecheck.
- Browser-Test: Kategorie öffnen, Alias-Kategorie hinzufügen, per Drag & Drop verschieben, entfernen — auf Smartphone- und Desktop-Breite.
