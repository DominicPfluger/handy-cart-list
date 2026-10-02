# Markt-Katalog nur noch über die Katalogansicht, Markt-Admins unter „Mehr“

## Was sich ändert
- **Tab „Märkte“ entfällt.** Der Bereich „Markt-Katalog verwalten“ (Kategorie wählen, Produkte umbenennen, ausblenden, löschen, nach Relevanz sortieren) wird dort entfernt. Das alles geht schon im Tab „Katalog“: Markt oben auswählen, dann sortieren, bearbeiten und ausblenden.
- **„Markt-Admins verwalten“ zieht in den Tab „Mehr“ um**, und zwar über den Link „Vorlese-Texte“.
- Neue Tab-Reihenfolge: Katalog, Rezepte & Küchen, Sprachen, Bilder, Preise, Import, Mehr.

## Was bleibt
- Wer nur Markt-Admin ist (kein Voll-Admin), sieht weiterhin die einfache Markt-Ansicht. Die Katalogansicht steht nur Voll-Admins zur Verfügung, darum braucht diese Gruppe ihre eigene Ansicht.
- Es gibt keine Änderungen an Daten, Rechten oder Übersetzungen.

## Technische Details
- Nur `src/routes/_authenticated/admin.tsx`:
  - `"markets"` aus dem Tab-Typ, der Tab-Liste und dem Render-Zweig entfernen.
  - `<MarketAdminsManager />` im `tab === "more"`-Zweig über dem Link zu den Vorlese-Texten rendern (in einem Container mit `space-y-4`).
  - Der Import `MarketAdmin` bleibt für die Ansicht der Markt-Admins ohne Voll-Admin-Rechte.
- Die i18n-Keys `adm.tab.markets` bleiben ungenutzt in den Sprachdateien. Das schadet nicht.
