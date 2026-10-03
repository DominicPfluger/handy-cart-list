# Admin-Tab „Rezept-Generator" umbenennen in „Rezept-Verwaltung"

## Ziel
Der Tab im Admin-Panel heisst neu „Rezept-Verwaltung" (statt „Rezept-Generator") — in allen 16 Sprachen übersetzt.

## Umsetzung
Der Tab-Text steht im Übersetzungsschlüssel `adm.tab.recipes`. Nur dieser Schlüssel wird geändert; die Rezepte-Hauptseite (`recipes.title`) und alle anderen Vorkommen von „Rezept-Generator" bleiben unverändert.

1. `src/i18n/de.ts`: `adm.tab.recipes` → „Rezept-Verwaltung"
2. `src/i18n/messages.json`: denselben Schlüssel in den 15 weiteren Lokalen anpassen:
   - en-US/en-GB/en-CA: „Recipe Management"
   - es-ES/es-MX: „Gestión de recetas"
   - fr-FR/fr-CA: „Gestion des recettes"
   - it-IT/it-CH: „Gestione ricette"
   - pt-PT/pt-BR: „Gestão de receitas"
   - nl-NL/nl-BE: „Receptenbeheer"
   - de-AT/de-CH: „Rezept-Verwaltung"

Keine Code-Änderung nötig — der Tab rendert bereits `adm.tab.recipes`.

## Prüfung
Typprüfung und Build; Browser-Check, dass der Tab im Admin-Panel „Rezept-Verwaltung" zeigt und alle Tabs weiter funktionieren.
