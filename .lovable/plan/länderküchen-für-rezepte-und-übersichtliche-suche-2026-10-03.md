# Länderküchen für Rezepte und übersichtliche Suche

## Ergebnis
- In „Rezepte suchen“ steht die Länderküche als erster Filter. Es lassen sich mehrere Küchen wählen; ein Rezept erscheint, wenn mindestens eine seiner Zuordnungen passt. Ohne Küchenauswahl bleiben alle Rezepte sichtbar.
- Sättigung, Schärfe, Preisklasse, Geschmack und Schwierigkeitsgrad erhalten jeweils einen eigenen Rahmen mit abgerundeten Ecken. Die bestehende Filterlogik und die Ergebnisliste bleiben erhalten.
- Beim Speichern eines Rezepts können mehrere Länderküchen ausdrücklich ausgewählt werden. Die Auswahl ist unabhängig vom Länderküchenfilter für Zutaten. Vorhandene Rezepte ohne Zuordnung bleiben sichtbar und können bei der Suche ohne Länderküchenfilter gefunden werden.

## Umsetzung
1. Die vorhandenen Länderküchen für Rezepte wiederverwenden und eine eigene Zuordnung für mehrere Küchen pro Rezept ergänzen. Leserechte für öffentliche Rezepte und eigene Rezepte sowie Schreibrechte für Rezeptbesitzer absichern; Berechtigungen und Schutzregeln direkt mit der neuen Tabelle anlegen.
2. Die Speicherauswahl in den Rezeptdialog einfügen und die Zuordnungen zuverlässig mit dem neuen Rezept speichern. Die übrigen Rezept-Erstellungswege weiterhin ohne Pflichtzuordnung zulassen.
3. In der Rezeptsuche Länderküchen und Rezeptzuordnungen laden, den neuen Filter zuerst anzeigen und mit den bisherigen Eigenschaften kombinieren. Jeder Eigenschaft einen eigenen abgerundeten Rahmen geben; „Zurücksetzen“ löscht auch die Küchenauswahl.
4. Neue sichtbare Texte in allen vorhandenen Sprachen ergänzen und Seitentitel/Beschreibung der Suche passend aktualisieren. Auf Mobilgerät und Desktop prüfen: mehrere Küchen auswählen, Rezept speichern, öffentliches Rezept mit passenden und unpassenden Küchen suchen, bestehende Rezepte ohne Zuordnung sehen und Filter zurücksetzen.

## Technische Hinweise
- Die Rezeptsuche filtert derzeit öffentliche Rezepte anhand der fünf Eigenschaften; die Generator-Auswahl für Länderküchen filtert bislang nur Zutaten. Rezepte haben noch keine eigene Länderküchen-Zuordnung. Deshalb eine `recipe_cuisines`-Zuordnungstabelle mit eindeutigen Paaren und passenden Leserechten/Schreibrechten anlegen, statt den gerätelokalen Zutatenfilter als Rezept-Eigenschaft zu interpretieren.
- Die Suchdaten werden derzeit bis 300 öffentliche Rezepte geladen; die neue Filterung folgt zunächst diesem bestehenden Umfang.
