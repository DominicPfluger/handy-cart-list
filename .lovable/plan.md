# Umbenennung: Rezept-Verwaltung → Rezept-Kategorien verwalten

## Ziel
Zwei Texte im Admin-Panel (Tab „Rezepte") ändern — reine Übersetzungsänderung, keine Funktionsänderung:

1. Tab-Bezeichnung „Rezept-Verwaltung" → **„Rezept-Kategorien verwalten"** (Schlüssel `adm.tab.recipes`)
2. Button „Neue Vorlage" → **„Neue Rezept-Kategorie"** (Schlüssel `adm.stepNew`)

## Umsetzung
- `src/i18n/de.ts`: die beiden deutschen Texte ändern.
- `src/i18n/messages.json`: dieselben zwei Schlüssel in allen 15 weiteren Lokalen anpassen, z. B.:
  - en: „Manage recipe categories" / „New recipe category"
  - fr: „Gérer les catégories de recettes" / „Nouvelle catégorie de recette"
  - es/it/pt/nl/de-AT/de-CH entsprechend sinngemäss.

## Nicht geändert
- Der Bereichs-Titel „Vorlagen" (`adm.tplManage`) bleibt unverändert, da nur Tab und Button genannt wurden.

## Verify
- Typprüfung/Build fehlerfrei; Browser-Test: Tab zeigt neuen Text, Button „Neue Rezept-Kategorie" sichtbar.
- roadmap.md ergänzen.
