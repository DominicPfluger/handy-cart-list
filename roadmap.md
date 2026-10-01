# Roadmap

- [x] Lieblingsmengen auf Produkt-Detailseite (localStorage, Vorausfüllung im Hinzufügen-Dialog, i18n 16 Sprachen)
- [x] Rezept-Generator: Speichern-Knopf unten im „Dein Rezept"-Kasten, gross grün; darunter „Zutaten zu Liste", dann Teilen — E2E verifiziert (nur 1 Speichern-Knopf, Reihenfolge korrekt)
- [x] App-Info am Ende von „Mehr": Icon, Name, Claim, Version, Copyright + Links Impressum / Datenschutz / Feedback — in der Vorschau geprüft
- [x] Neue Seiten /impressum und /datenschutz (Titel lokalisiert, Text deutsch; Feedback/Kontakt = dominic.pfluger@gmx.ch)
- [x] Übersetzungen für more.version/copyright/imprint/privacy/feedback in alle 15 Sprachen (messages.json)
- [ ] Offen: Echte Anbieterangaben (Name, Adresse, PLZ/Ort, Land) fürs Impressum vom Nutzer einsammeln — aktuell Platzhalter in src/routes/impressum.tsx; Kontakt-E-Mail zentral in src/lib/app-version.ts (FEEDBACK_EMAIL)
- [x] Rezept-Generator-Untertitel (rk.sub) neu: „Wähle eine Kategorie und stelle dir aus deinen Lieblingszutaten dein persönliches Wunschrezept zusammen. …" — de.ts + alle 13 übersetzten Blöcke in messages.json (de-AT/de-CH nutzen de-Fallback)
- [x] „Alle Märkte anzeigen" bleibt immer sichtbar (Nutzer-Entscheid) — bedingte Einblendung in mehr.tsx wieder entfernt
- [x] Rezept-Generator zurück auf eigene Seite /rezepte/generator; Rezepte-Hauptseite zeigt wieder nur Kacheln (Generator → Listen → Inspirationen)
- [x] Feedback-Formular (Name, E-Mail, Betreff aus 7 Einträgen, Nachricht) + Admin-Posteingang
- [x] Öffentliche Landingpage: /start mit Hero (Tagline „Gemeinsam.Einfach.Einkaufen."), Features, Mockups, Installationshinweis, beliebte/neue Rezepte, Generator, Community, Angebote, FAQ, Kontakt, Newsletter-Platzhalter, News, Footer — alle land.*-Texte in de.ts + messages.json (16 Sprachen); erster Besuch auf / zeigt die Landingpage (Flag „shoppi:landing-seen", src/lib/landing.ts), danach direkt die Liste; Footer-Link „Shoppi-Website" auf /start — E2E geprüft (Erstbesuch Landing, nach „App öffnen" Liste, Reload bleibt Liste, /start direkt)
