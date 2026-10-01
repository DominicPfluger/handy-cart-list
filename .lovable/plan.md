# Lokalisierte Abteilungsansicht mit Markt-Admins

Ergebnis der Prüfung: **gut machbar**. Die App kennt bereits 14 Märkte (DE, AT, CH, US, GB, CA, ES, MX, FR, IT, PT, BR, NL, BE). Der Markt ergibt sich aus der gewählten Sprachvariante, z. B. „Deutsch (Schweiz)“ → CH. Bei den Marken wird er schon so verwendet.

## Was Nutzer sehen
- In der Abteilungsansicht erscheinen nur Produkte, die für den eigenen Markt relevant sind. Ausgeblendet werden Produkte, die für diesen Markt ausgeschlossen sind.
- Marktspezifische Produkte (z. B. Rivella nur CH) erscheinen nur in diesem Markt.
- Pro Markt gilt eine eigene Produktreihenfolge. Gibt es keine, wird die globale Reihenfolge verwendet.
- Die Kategorien selbst bleiben global. Leere Kategorien werden im jeweiligen Markt ausgeblendet.
- Unter „Mehr“ gibt es den Schalter **„Alle Märkte anzeigen“**. Ist er an, siehst du den gesamten Katalog mit den Produkten aller Märkte. Marktspezifische Produkte tragen dann eine kleine Länderflagge, z. B. 🇨🇭. Die Sortierung folgt weiterhin deinem eigenen Markt. Die Einstellung bleibt nur auf diesem Gerät gespeichert.

## Admin-Rollen
- **Haupt-Admin** (du): Wie bisher darfst du alles. Zusätzlich vergibst du Markt-Admins und verwaltest alle Märkte.
- **Markt-Admin** (z. B. für CH): sieht im Admin-Panel einen Markt-Schalter, der fest auf seinen Markt gesetzt ist, und darf nur dort:
  - marktspezifische Produkte anlegen, bearbeiten und löschen,
  - globale Produkte für seinen Markt aus- oder einblenden. Gelöscht werden sie nie für andere Märkte.
  - Produkte innerhalb von Kategorien für seinen Markt sortieren.
- Globale Produkte, Kategorien, Bilder, Rezepte, Länderküchen und Vorlese-Texte bleiben dem Haupt-Admin vorbehalten.
- Neuer Bereich „Admins verwalten“: Person per E-Mail einem oder mehreren Märkten zuweisen und wieder entfernen.

## Ablauf
1. Datenbank: Markt-Felder, Marktreihenfolge und Markt-Admin-Rollen anlegen, inklusive Zugriffsregeln
2. Katalog nach Markt filtern und sortieren
3. Admin-Panel mit Markt-Schalter und eingeschränkten Rechten
4. Admin-Verwaltung, Texte in allen Sprachen, Test als Haupt-Admin und als Markt-Admin

## Technische Details
- `products.markets text[] default '{}'`: leer bedeutet global, sonst nur diese Märkte (marktspezifisch).
- Neue Tabelle `product_market_exclusions(product_id, market)`: globales Produkt in einem Markt ausblenden.
- Neue Tabelle `product_market_order(product_id, market, department_id, sort_order)`: Reihenfolge pro Markt mit Fallback auf `products.sort_order`.
- Neue Tabelle `market_admins(user_id, market)`, getrennt von `user_roles`. Dazu die Security-Definer-Funktion `is_market_admin(uid, market)`.
- RLS: Markt-Admins dürfen Produkte nur ändern oder löschen, wenn `markets = '{<eigener Markt>}'`. Bei Ausschlüssen und Reihenfolge nur Zeilen ihres Marktes. Haupt-Admin über `has_role(admin)` wie bisher. `market_admins` darf nur der Haupt-Admin schreiben.
- Übersetzungen neuer Marktprodukte laufen über den bestehenden KI-Übersetzungsweg. Der Server prüft dabei die Markt-Rechte statt nur `admin`.
- Filter und Sortierung in `catalog-query.ts`, angewendet in Abteilungsansicht, Suche, Scanner und Rezept-Zutaten.
- Offen: Ob der Markt für Nutzer unabhängig von der Sprache wählbar sein soll (z. B. Englisch in der Schweiz). Vorschlag: zunächst automatisch aus der Sprache, später optional eine Einstellung in „Mehr“.
