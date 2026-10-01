# Roadmap

- [x] Lieblingsmengen auf Produkt-Detailseite (localStorage, Vorausfüllung im Hinzufügen-Dialog, i18n 16 Sprachen)
- [x] Rezept-Generator: Speichern-Knopf unten im „Dein Rezept"-Kasten, gross grün; darunter „Zutaten zu Liste", dann Teilen — E2E verifiziert (nur 1 Speichern-Knopf, Reihenfolge korrekt)
- [x] App-Info am Ende von „Mehr": Icon, Name, Claim, Version, Copyright + Links Impressum / Datenschutz / Feedback — in der Vorschau geprüft
- [x] Neue Seiten /impressum und /datenschutz (Titel lokalisiert, Text deutsch; Feedback/Kontakt = dominic.pfluger@gmx.ch)
- [x] Übersetzungen für more.version/copyright/imprint/privacy/feedback in alle 15 Sprachen (messages.json)
- [ ] Offen: Echte Anbieterangaben (Name, Adresse, PLZ/Ort, Land) fürs Impressum vom Nutzer einsammeln — aktuell Platzhalter in src/routes/impressum.tsx; Kontakt-E-Mail zentral in src/lib/app-version.ts (FEEDBACK_EMAIL)
- [x] Rezept-Generator-Untertitel (rk.sub) neu: „Wähle eine Kategorie und stelle dir aus deinen Lieblingszutaten dein persönliches Wunschrezept zusammen. …" — de.ts + alle 13 übersetzten Blöcke in messages.json (de-AT/de-CH nutzen de-Fallback)
- [ ] Offen/Klärung: „Alle Märkte anzeigen" nach Sprache & Region einblenden — Nutzer wollte klären; Katalog hat aktuell 0 marktspezifische Produkte. AllMarketsRow in mehr.tsx blendet jetzt nur ein, wenn fremde Produkte/Ausblendungen für den Markt existieren (marketOf(locale)); bei leeren Marktdaten ist der Schalter verborgen. Frage an Nutzer offen: nur bei fremden Produkten / Märkte der Sprache auflisten / immer anzeigen.
