# Aufklappbare Bereiche in der Admin-Rezeptverwaltung

## Ziel
Die Rezeptverwaltung soll übersichtlicher werden: Einzelne Bereiche lassen sich unabhängig ein- und ausklappen, ohne dass Eingaben oder Zuordnungen dadurch verloren gehen.

## Umsetzung
- Die bestehende gesamte Rezeptverwaltung bleibt wie bisher aufklappbar. Innerhalb einer gewählten Rezeptvorlage erhalten die Bereiche **Oberkategorien**, **Rezept-Kategorien** und die **Zutatenlisten je Oberkategorie** jeweils einen eigenen Kopf mit Pfeil.
- Die Vorlagenverwaltung mit beliebten Kombinationen und Vorschau behält ihren eigenen Aufklapp-Schalter; die vorhandenen Aktionen zum Anlegen, Bearbeiten, Sortieren und Löschen bleiben erreichbar.
- Beim Wechsel der Vorlage bleiben die Abschnittszustände sinnvoll erhalten; geöffnete Eingabemasken und Auswahlen werden beim blossen Zuklappen nicht gelöscht. Die Zutatenanzahl bleibt auch bei geschlossenem Bereich im Kopf sichtbar.
- Auf Handy und Desktop prüfen, dass mehrere Bereiche gleichzeitig geöffnet sein können und die Verwaltung weiterhin bedienbar ist.

## Technische Hinweise
Nur die Darstellung und lokale Aufklappzustände in der Admin-Rezeptverwaltung ändern; keine Datenbank- oder Rezeptgenerator-Änderung. Vorhandene übersetzte Bereichsnamen nutzen und neue sichtbare Texte bei Bedarf für alle Sprachen ergänzen. Schalter mit `aria-expanded` und eindeutigem Bezug zum jeweiligen Inhalt versehen.
