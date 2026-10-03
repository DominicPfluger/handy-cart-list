# KI-Vorschläge für Produktvarianten im Admin-Panel

## Was sich ändert
Im bestehenden Dialog „Varianten für ‚Produkt‘“ (Etiketten-Symbol in der Admin-Produktliste) kommt ein Knopf „✨ Varianten per KI vorschlagen" dazu.

Ablauf:
1. Klick auf den Knopf: Bestätigungsfrage wegen Credits-Verbrauch, mit Auswahl der Anzahl (5 / 10 / 15, Voreinstellung 10).
2. Die KI schlägt typische Varianten vor (z. B. Paprika: Rot, Grün, Gelb; Joghurt: Natur, Erdbeere …), passend zu Produkt und Kategorie, ohne bereits vorhandene Varianten.
3. Vorschläge erscheinen als anklickbare Chips (standardmässig alle ausgewählt). „Übernehmen" fügt die gewählten Varianten ins Eingabefeld ein.
4. Speichern wie bisher über „Hinzufügen" (Dubletten werden weiterhin ignoriert, Übersetzung läuft im Hintergrund).

Nichts wird ohne Bestätigung gespeichert.

## Technische Details
- `src/lib/admin.functions.ts`: neue Server-Funktion `suggestVariants` (requireSupabaseAuth + assertAdmin), Eingabe `{ productId, count }`; lädt Produktname, Kategoriepfad und bestehende Varianten; ruft `aiJson` (gleiches Muster wie `suggestProducts`) mit Schema `{ items: [{ name }] }`; Prompt: kurze deutsche Variantenbezeichnungen (Sorte, Geschmack, Farbe, Ausführung), keine Marken, keine Packungsgrössen; filtert vorhandene Varianten case-insensitiv heraus und begrenzt auf `count`.
- `src/components/admin/catalog-tile-editor.tsx` (`VariantAddDialog`): Knopf, Bestätigungs-Overlay mit Anzahl-Select, Chip-Auswahl, Übernehmen in `text`; Fehlertoast bei 402/429.
- i18n in `de.ts` + `messages.json` (alle 16 Sprachen): `adm.variantSuggest`, `adm.variantSuggestConfirm`, `adm.variantSuggestApply`, `adm.variantSuggestNone`; Anzahl-Label über bestehendes `adm.suggestCount`.
- Browser-Test mit Paprika, roadmap.md ergänzen.
