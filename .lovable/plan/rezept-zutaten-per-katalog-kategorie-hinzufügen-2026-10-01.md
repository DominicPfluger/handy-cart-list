# Rezept-Zutaten per Katalog-Kategorie hinzufügen

## Was sich ändert
Im Admin-Panel unter „Rezept-Zutaten“ bekommt jeder Schritt (z. B. Proteinquelle, Saucen) einen Button „+ Aus Katalog“. Er öffnet eine Auswahl in drei Schritten:

1. **Kategorie wählen**: Liste der Hauptkategorien des Katalogs, mit Emoji.
2. **Unterkategorie wählen**, falls vorhanden. Ein Zurück-Pfeil führt eine Ebene nach oben.
3. **Produkte abhaken**: Alle Produkte der gewählten Kategorie erscheinen mit Checkbox, in der Katalog-Reihenfolge. Bereits zugeordnete Produkte sind schon abgehakt. Dazu kommen „Alle auswählen“ und „Keine auswählen“.

Mit „Übernehmen (X)“ werden neu abgehakte Produkte am Ende der Liste angehängt. Produkte, deren Häkchen du entfernt hast, werden aus dem Schritt gelöscht. „Abbrechen“ schliesst die Auswahl, ohne etwas zu ändern.

Die bisherige Suche bleibt zusätzlich erhalten, ebenso die Pfeile ▲▼ zum Sortieren.

## Technische Details
- Nur `src/components/recipe-admin.tsx`: neuer State `pickerStep` (Schritt-Key), `pickerDept` (aktuelle Abteilungs-ID oder null) und `pickerSel` (Set mit Produkt-IDs, vorbefüllt mit den zugeordneten Produkten).
- Kategorie-Ebenen kommen aus `depts` über `parent_id`; Produkte aus `prods.filter(department_id === pickerDept)`, sortiert nach `sort_order`.
- Übernehmen: neu ausgewählte Produkte werden in einem einzigen Upsert in `recipe_ingredients` eingefügt, mit fortlaufendem `sort_order`. Abgewählte werden mit einem einzigen Delete über `.in("product_id", …)` entfernt. Danach werden die Daten neu geladen (die bestehende Funktion `run`).
- Neue Texte `adm.fromCatalog`, `adm.selectAll`, `adm.selectNone`, `adm.apply` in `de.ts` und allen 15 Sprachen in `messages.json`.
- Keine Änderungen an der Datenbank.
