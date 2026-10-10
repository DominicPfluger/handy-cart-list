# Katalog pro Laden verwalten + Laden-Administratoren

## Ziel
Für jeden Laden (z.B. Migros, Coop) kann ein eigener Katalog-Blick gepflegt werden, ohne den gemeinsamen Katalog zu verändern. Laden-Admins pflegen nur „ihren" Laden.

## Was Laden-Admins können
- Kategorien: umsortieren, umbenennen, ausblenden („löschen" für diesen Laden)
- Produkte: umsortieren, ausblenden, ändern (Name, Emoji, Standardmenge/-einheit)
- Der gemeinsame Katalog bleibt unverändert; Laden-Änderungen liegen als Abweichungen darüber. „Zurücksetzen" stellt den Standard wieder her.

## Für Nutzer
- Wählt jemand in der App einen Laden, zeigt die Abteilungsansicht dessen Reihenfolge, Namen und ausgeblendete Einträge. Ohne Laden-Wahl („Standard") bleibt alles wie heute.

## Adminpanel
- Neuer Tab „Läden-Katalog": Laden wählen, dann dieselbe Kachel-/Listenansicht wie heute, aber Speichern schreibt nur Laden-Abweichungen.
- Im bestehenden „Sprachen & Märkte"-Bereich pro Laden: Laden-Admins per E-Mail hinzufügen, auflisten, entfernen (nur Haupt-Admins).
- Laden-Admins sehen im Adminpanel nur den Läden-Katalog ihrer Läden.

## Technische Details
- Neue Tabellen (mit GRANTs + RLS):
  - `store_admins(user_id, email, supermarket_id)` – verwaltet von Admins.
  - `store_department_overrides(supermarket_id, department_id, name, sort_order, hidden)`
  - `store_product_overrides(supermarket_id, product_id, name, emoji, default_quantity, default_unit, sort_order, hidden)`
- Security-definer-Funktion `is_store_admin(user, supermarket_id)`; Schreibrechte = `has_role admin` oder `is_store_admin`; Lesen öffentlich.
- Server-Funktionen in `admin.functions.ts` analog `market_admins` (Hinzufügen per E-Mail, Entfernen).
- Katalog-Lesepfad: Overrides des gewählten Ladens nach dem Laden mergen (Name ersetzt, hidden filtert, sort_order überschreibt); offline im Katalog-Cache mitgespeichert.
- Neue Texte nur in `de.ts`.
