# Shoppi lokalisieren: 16 Sprachen und Märkte

## Ziel
Die gesamte App (Oberfläche, Kategorien und Produkte) erscheint in 16 Sprachvarianten und verwendet die regional üblichen Begriffe und Schreibweisen (z. B. de-CH „Rüebli“, „Randen“ und ss statt ß; de-AT „Paradeiser“, „Palatschinken“; en-GB „aubergine“ statt en-US „eggplant“; pt-BR und pt-PT mit eigener Schreibweise).

Unterstützte Sprachvarianten: en-US, en-GB, en-CA, de-DE, de-AT, de-CH, es-ES, es-MX, fr-FR, fr-CA, it-IT, it-CH, pt-PT, pt-BR, nl-NL, nl-BE.

## Was sich für dich ändert
1. **Sprachwahl**: Die App übernimmt automatisch die Sprache des Geräts. Unter „Mehr“ lässt sich die Sprache jederzeit ändern (Liste mit Flagge und Land).
2. **Ganze Oberfläche übersetzt**: Tabs, Knöpfe, Dialoge, Teilen-Texte und Hinweise.
3. **Katalog übersetzt**: Alle bestehenden Kategorien und Produkte erhalten einmalig per KI Namen in allen 16 Sprachvarianten, mit regionalen Begriffen. Fehlt eine Übersetzung, erscheint automatisch die nächstliegende Variante (z. B. de-CH → de-DE → Deutsch).
4. **Admin-Bereich** (neue Seite „Katalog verwalten“, erreichbar über „Mehr“, nur mit Login und Admin-Rolle):
   - Tabelle aller Kategorien und Produkte, mit einer Spalte pro Sprachvariante und Bearbeitung direkt in der Zelle
   - Knopf „Fehlende Übersetzungen per KI ergänzen“
   - Neue Produkte und Kategorien anlegen; sie werden sofort automatisch in alle Sprachen übersetzt
   - Von Hand korrigierte Übersetzungen werden markiert und von der KI nie wieder überschrieben
5. Deine Einkaufslisten bleiben erhalten. Die Artikel darin erscheinen in der gewählten Sprache, sofern sie aus dem Katalog stammen.

## Hinweise
- Für den Admin-Zugang lege ich ein Login mit E-Mail und Google an. Deinem Konto gebe ich nach deiner ersten Anmeldung die Admin-Rolle.
- Die KI-Übersetzung von rund 1000 Namen in 16 Varianten verbraucht einmalig KI-Guthaben. Danach fallen Kosten nur noch für neue Einträge an.
- Die Suche funktioniert in der jeweils gewählten Sprache.

## Technische Details
- DB: Tabelle `catalog_translations` (`entity_type` department/product, `entity_id`, `locale`, `name`, `is_manual`, Timestamps; unique entity+locale). Öffentlich lesbar; Schreibzugriff nur für Admins über `has_role`. Dazu `app_role`-Enum, `user_roles` und `has_role()` gemäß Standardmuster.
- Server-Funktionen: `translateEntities` (Admin, Lovable AI Gateway `openai/gpt-6-astra`, Responses API, Batches pro Locale mit strukturierter JSON-Ausgabe und Prompt, der regionale Begriffe und Orthographie verlangt); `upsertTranslation`; `createProduct` / `createDepartment` lösen die Auto-Übersetzung aus. Die Übersetzungen, die ich jetzt anlege, laufen über die Admin-Aktion bzw. einmalig über ein Skript.
- `catalog.functions.ts` liefert die Übersetzungen mit; `catalog-query` löst Namen über die Fallback-Kette locale → Sprache → de-DE auf.
- UI-i18n: leichtgewichtiger eigener `I18nProvider` + `t()` mit Wörterbüchern pro Locale in `src/i18n/`; Locale in localStorage, Erkennung über `navigator.languages` nach der Hydration; `<html lang>` wird aktualisiert.
- Routen: `/auth`, `_authenticated/admin` (Rollenprüfung serverseitig).
- Offene Punkte aus früheren Aufgaben (Kategorie „Fertigteige“ prüfen und fertigstellen) werden vorher abgeschlossen.
