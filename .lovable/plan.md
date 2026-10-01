# Pfannengericht: Rezept-Ersteller anpassen

## Ziel
Die Vorlage „Pfannengericht" im Rezept-Ersteller bekommt neue/umbenannte Schritte:

```text
1. Stärkebeilage   (war: Sättigungsbeilage, 1 Auswahl)
2. Proteinquelle   (war: Protein, jetzt Mehrfachauswahl bis 2)
3. Gemüse          (unverändert)
4. Früchte         (NEU, optional, bis 2)
5. Saucen          (NEU, optional, unbegrenzte Mehrfachauswahl)
6. Würze           (unverändert)
```

## Änderungen

1. **Vorlage `pfanne`** in `src/lib/recipe-templates.ts`:
   - Schritt `base`: Label „Sättigungsbeilage" → „Stärkebeilage"
   - Schritt `protein`: Label „Protein" → „Proteinquelle", `max: 1` → `max: 2` (Mehrfachauswahl)
   - Neuer Schritt `fruit` („Früchte", min 0, max 2) nach `veg` — Zutaten z. B. Ananas, Mango, Äpfel, Zitronen
   - Neuer Schritt `sauce` („Saucen", min 0, unbegrenzte Mehrfachauswahl) vor `aroma` — Zutaten z. B. Sojasauce, Teriyaki-Sauce, Sweet-Chili-Sauce, Kokosmilch, Crème fraîche
   - `POPULAR_RECIPES.pfanne` um passende Sauce-/Frucht-Angaben ergänzen

2. **Datenbank (`recipe_ingredients`)**: Da die Zutaten-Auswahl inzwischen datenbankgesteuert ist, werden die umbenannten Schritte automatisch mit den bestehenden Zuordnungen weiterverwendet (Schlüssel bleiben gleich). Für die neuen Schritte `fruit` und `sauce` werden Start-Zuordnungen eingefügt; fehlende Katalogprodukte (z. B. Sojasauce, Teriyaki-Sauce, Sweet-Chili-Sauce) werden als Produkte im Katalog angelegt (mit Übersetzungen in alle 15 Sprachen), damit sie auch als normale Einkaufslisten-Artikel existieren.

3. **Admin-Panel**: Die neuen Schritte erscheinen automatisch im Bereich „Rezept-Zutaten" und sind dort per Checkbox pflegbar — keine weitere Änderung nötig.

## Hinweise
- Bereits gespeicherte Pfannengericht-Rezepte behalten ihren Namen; die Auswahl der umbenannten Schritte bleibt erhalten (gleiche Schlüssel).
- Build + Sichtprüfung in der Vorschau (Pfannengericht öffnen, alle 6 Schritte in neuer Reihenfolge, Mehrfachauswahl bei Proteinquelle und Saucen testen).
