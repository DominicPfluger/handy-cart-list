# Admin-Panel: Übersichtlicher Aufbau mit Tabs

Der Admin-Bereich (`/admin`) ist heute eine einzige lange Seite: Katalog-Verwaltung, Import, Sprachen, KI-Bilder & Richtpreise, Märkte, Rezepte, Küchen und Vorlese-Texte stehen untereinander. Das wird per Tab-Leiste gegliedert.

## Tabs oben (Katalog zuerst)

Beim Öffnen erscheint wie gewohnt zuerst die Katalog-Verwaltung. Die übrigen Bereiche rücken in Tabs:

| Tab | Inhalt (heute) |
|---|---|
| Katalog | Statistiken, „Übersetzungen ergänzen", Katalogsprache, Liste/Kacheln, Suche, Katalog-Browsing + Editor |
| Bilder & Preise | Container „KI-Bilder & Richtpreise" (`CatalogMediaPanel`) |
| Import | Sortiments-Import (`ImportPanel`) |
| Sprachen | „Sprachen & Lokalisierungen" (`LocaleAdminPanel`) |
| Märkte | „Märkte & Angebote" + Markt-Admins (`MarketAdmin`, `MarketAdminsManager`) |
| Rezepte & Küchen | `RecipeAdmin` + `CuisineAdmin` |
| Mehr | Link „Vorlese-Texte" (Abmelden bleibt oben rechts beim Titel) |

## Umsetzung

- `src/routes/_authenticated/admin.tsx`: Neuer State `tab` (Default `"catalog"`). Unter Titel/Abmelden eine horizontal scrollbar wirkende, am Shoppi-Stil orientierte Tab-Leiste (Pills, aktiver Tab hell/grün wie die Liste/Kacheln-Schaltung). Nur der aktive Tab wird gerendert; der Katalog-State (aktuelle Kategorie, Auswahl, Liste/Kacheln, Suche, Markt-Auswahl) bleibt im Header der Seite erhalten und geht beim Tab-Wechsel nicht verloren.
- Wichtig: Das bestehende Event `shoppi:admin-tiles` (blendet die untere Menüleiste in der Kachel-Ansicht aus) feuert weiterhin beim Verlassen/Betreten des Katalog-Tabs korrekt — der bestehende `useEffect` bleibt unverändert.
- Keine Datenänderung, keine neuen Routen, keine Verhaltensänderung — nur Gliederung.

## Texte (i18n)

Neue Tab-Beschriftungen in `src/i18n/de.ts` und allen 15 Lokalen in `src/i18n/messages.json`:
`adm.tab.catalog` (Katalog), `adm.tab.media` (Bilder & Preise), `adm.tab.import` (Import), `adm.tab.languages` (Sprachen), `adm.tab.markets` (Märkte), `adm.tab.recipes` (Rezepte & Küchen), `adm.tab.more` (Mehr).

## Prüfung

- Build fehlerfrei.
- In der Vorschau (Admin-Konto) prüfen: Tabs wechseln, Katalog zuerst, Zustand bleibt beim Hin- und Herschalten, Kachel-Ansicht blendet die untere Menüleiste weiterhin aus.
