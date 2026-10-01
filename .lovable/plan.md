# Öffentliche Shoppi-Website (Landingpage) unter der künftigen Domain

## Ziel
Eine öffentliche Website, die Besucher unter der später registrierten Domain sehen — mit allen gewählten Inhalten. Sie stellt Shoppi vor und führt direkt in die App (App öffnen / installieren). Design führt das App-Erscheinungsbild fort: Grün #2E7D32, freundlich, grosse runde Formen; auf Desktop breiter zentriert (max. ~1100 px), mobil-first.

## Route & Verhalten
- Neue Seite `/start` (SSR-fähige Metadaten, eigener Titel/Beschreibung/og-Tags für Suchmaschinen und geteilte Links).
- Erster Besuch auf `/`: Besucher ohne bisherige App-Nutzung sehen die Landingpage; Knopf «App öffnen» merkt sich die Entscheidung auf dem Gerät und zeigt danach wieder direkt die Einkaufsliste. Rückweg zur Landingpage über Footer-Link.
- Domain ist noch nicht festgelegt: Seite wird domain-unabhängig gebaut; die Domain kann später in Lovable hinterlegt werden, ohne Codeänderungen.

## Inhalte (alle gewählten Optionen)
1. **Hero** — Shoppi-Logo (grünes App-Icon), Name, Tagline «Gemeinsam.Einfach.Einkaufen.», kurzer Untertitel, grüner Hauptknopf «App öffnen» + Sekundärknopf «Rezepte entdecken».
2. **Feature-Blöcke** — 4 Karten mit Icon: Gemeinsame Listen (Live-Sync, Einladungen), Katalog mit Filtern (Ernährungsformen, Länderküchen), Rezepte (Generator + Community), Angebote & Vorlesen / offline nutzbar.
3. **App-Screenshots/Mockups** — 3 Handy-Mockup-Bilder (Einkaufsliste, Abteilungsansicht, Rezept-Generator), mit Bildgenerator erstellt und eingebunden.
4. **App installieren** — Installationshinweis für iPhone (Teilen → Zum Home-Bildschirm) und Android (Installieren), automatischer Installations-Knopf wo der Browser ihn anbietet.
5. **Community-Funktionen / Rezept-Vorschau** — Live-Bereich «Beliebte Rezepte» und «Neue Rezepte» aus den öffentlichen geteilten Rezepten (wie auf der Inspirations-Seite), Karten verlinken auf die geteilten Rezeptseiten.
6. **Rezept-Generator vorstellen** — Abschnitt mit den 8 Kategorie-Icons (Müsli, Smoothie, … Pizza, Dessert) und Kurztext; Knopf führt in den Generator.
7. **Community-Bereich** — kurzer Text, wie Teilen funktioniert (🔒 privat / 🌍 öffentlich), Verweis auf Community-Rezepte.
8. **Angebote-Highlight** — Teaser der Angebote-Funktion (ohne echte Preise).
9. **FAQ** — aufklappbare Fragen: Was kostet Shoppi? Brauche ich ein Konto? Funktioniert es offline? Welche Sprachen gibt es? Wie teile ich Listen/Rezepte?
10. **Kontakt** — Verweis auf das bestehende Feedback-Formular (/feedback).
11. **Sprachumschalter** — Sprachauswahl für die Landingpage (de/en/es/fr/it/pt/nl), gleiche Mechanik wie in der App.
12. **Newsletter-Anmeldung** — E-Mail-Feld mit Prüfung und Bestätigungsmeldung (Platzhalter, ohne Versand/ Speicherung).
13. **News-/Blog-Platzhalter** — Abschnitt «Neuigkeiten» mit 2–3 statischen Platzhalter-Karten.
14. **Footer** — Links zu Impressum und Datenschutz (Seiten existieren bereits), Copyright, Link zur Landingpage («Startseite»).

## Übersetzungen
Alle Landing-Texte (ca. 60 Schlüssel `land.*`) in allen 16 Sprachen (de.ts + messages.json), inkl. FAQ, Feature-Texten und Platzhaltern — wie gewohnt, ohne dass du nachfragen musst.

## Umsetzung
- `src/routes/start.tsx` — neue Seite, Sektionen als Komponenten in `src/components/landing/`.
- Erste-Besuch-Logik in `src/routes/index.tsx` (lokale Merk-Variable, ohne Änderung am Listenverhalten).
- 3 Mockup-Bilder mit Bildgenerator erzeugen (App-Stil, grün/weiss).
- FAQ/Installationshinweise als Accordion; sanfte Scroll-Animationen der Sektionen.
- Head-Metadaten für /start: eigener Titel, Beschreibung, og/Twitter-Tags.
- E2E-Check in der Vorschau: erster Besuch zeigt Landingpage, «App öffnen» landet in der Liste, alle Sektionen und der Sprachumschalter funktionieren, Rezept-Karten öffnen die geteilten Seiten.

## Offen (braucht dich)
- Echter Domainname: sobald registriert, in Lovable hinterlegen (kein Codeaufwand).
- Newsletter: aktuell nur Bestätigung ohne Versand — echte Anmeldungen brauchen einen Versanddienst (später erweiterbar).
- Impressum-Platzhalter (Anbieterangaben) weiterhin offen.
