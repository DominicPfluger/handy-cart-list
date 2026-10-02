# Verbesserungsvorschläge für Shoppi

Ein Katalog von Ideen über alle Bereiche. Du wählst aus, was ich umsetzen soll — nichts davon wird automatisch gebaut.

## Alltag & Einkaufen

1. **Schnell-Hinzufügen-Leiste**: Beim Tippen im Suchfeld die zuletzt gekauften und häufigsten Produkte sofort als Chips anzeigen — ein Tipp genügt.
2. **Mengen-Schnelltasten**: Direkt in der Liste per +/- die Menge ändern, ohne den Eintrag zu öffnen.
3. **Einkaufs-Modus**: Grossschrift-Ansicht zum Abhaken im Laden — nur noch Häkchen, keine Bearbeitungs-Knöpfe, Bildschirm bleibt wach.
4. **Wiederkehrende Artikel**: App schlägt Produkte vor, die du regelmässig kaufst, wenn sie länger nicht auf der Liste waren.
5. **Notizen-Foto pro Eintrag**: Foto an einen Listeneintrag hängen (z. B. Verpackung, die man sucht).

## Rezepte & Kochen

6. **„Was kann ich kochen?"**: Rezepte vorschlagen, deren Zutaten grösstenteils auf der aktuellen Einkaufsliste oder in den Favoriten stehen.
7. **Portionen-Rechner**: Rezept auf 2/4/6 Personen umrechnen; Mengen der Zutaten passen sich an, auch beim Übernehmen auf die Liste.
8. **Koch-Modus**: Rezept Schritt für Schritt gross anzeigen, Bildschirm bleibt an, optional Vorlesen der Schritte (Sprachausgabe existiert schon).
9. **Rezept-Bilder per KI**: Für Rezepte ohne Bild automatisch ein appetitliches Titelbild erzeugen.
10. **Wochenplaner**: Rezepte auf Wochentage ziehen, daraus automatisch eine gemeinsame Einkaufsliste erzeugen.

## Admin & Katalog

11. **KI-Bilder-Stapelverarbeitung**: „Alle Produkte ohne Bild" in einem Lauf bebildern, mit Fortschritt und Abbruch-Knopf.
12. **Dubletten-Finder**: KI sucht im Katalog nach doppelten oder fast gleichen Produkten und schlägt Zusammenführungen vor.
13. **Katalog-Gesundheit**: Übersichtsseite — wie viele Produkte ohne Bild, ohne Preis, ohne Übersetzung, ohne Kategorie-Filter-Zuordnung.
14. **Angebote aus Supermarkt-Liste**: Die vorhandene Supermarkt-Tabelle auf der Angebotsseite nutzen (heute noch Demo-Daten).
15. **Änderungs-Protokoll**: Wer hat wann welches Produkt geändert — hilfreich bei mehreren Markt-Admins.

## Design & Technik

16. **Schnellerer Start**: Katalog-Daten in kleineren Häppchen laden, damit die App spürbar früher reagiert (heute ca. 35 s erster Katalog-Abruf im Admin).
17. **Dunkelmodus**: Komplettes dunkles Farbschema, wählbar unter „Mehr".
18. **Schriftgrösse einstellbar**: Klein / Normal / Gross unter „Mehr" — gerade im Laden hilfreich.
19. **Push aktivieren**: Der Push-Webhook ist gebaut, aber inaktiv, weil die Firebase-Anbindung fehlt. Mit Web-Push (ohne Firebase) liesse sich das lösen.
20. **Installierbare App (PWA) polieren**: Eigenes Icon auf dem Homescreen, Offline-Startseite, Splash im gewählten Icon-Set.

## Wie weiter?

Sag mir, welche Nummern ich umsetzen soll (z. B. „1, 3, 6 und 17") — ich lege dann direkt los oder erstelle dafür einen Detailplan.

## Technische Hinweise

- Punkte 1–3, 7, 12, 13, 16–18: reine App-Änderungen, keine neuen Tabellen.
- Punkt 4 nutzt die vorhandene Kauf-Historie (lokal). Punkt 10 bräuchte eine kleine neue Tabelle für den Wochenplan.
- Punkt 19: Web-Push über den bestehenden Webhook unter `/api/public/`, VAPID-Schlüssel als Secret.
- Punkt 14: `supermarkets`-Tabelle existiert bereits und ist befüllt; die Angebotsseite liest sie noch nicht.
