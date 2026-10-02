# Zutaten in der Admin-Rezeptverwaltung durchsuchen

## Ziel
In der Rezept-Generator-Verwaltung lassen sich Zutaten einer gewählten Vorlage schnell finden und zuordnen, ohne erst durch Kategorien navigieren zu müssen.

## Umsetzung
- Die vorhandene Suche in der Zutatenverwaltung so erweitern, dass sie **bereits zugewiesene und noch nicht zugewiesene Produkte** findet. Passende Zutatenbereiche werden während der Suche angezeigt; ohne Suchbegriff bleibt die gewohnte aufklappbare Ansicht erhalten.
- In „Aus Katalog“ ein eigenes Suchfeld ergänzen: Es durchsucht den gesamten verfügbaren Produktkatalog unabhängig von der gerade geöffneten Abteilung. Treffer zeigen Produktname und Abteilung und können direkt per Checkbox ausgewählt oder abgewählt werden.
- Eine verständliche Anzeige für leere Treffer ergänzen. Beim Schliessen oder Wechsel des Zutatenbereichs die Katalogsuche zurücksetzen; bestehende Auswahlen und der „Übernehmen“-Ablauf bleiben erhalten.
- Neue Beschriftungen auf Deutsch und in den vorhandenen App-Sprachen ergänzen.

## Technische Hinweise
Die Suche filtert die bereits geladenen Produkte im Browser; dafür sind keine neuen Datenbanktabellen, KI-Aufrufe oder Credits nötig. Die bestehende Zuweisungslogik wird wiederverwendet. Anschliessend die Suche und das Auswählen in der Admin-Ansicht auf Desktop und Handy prüfen.
