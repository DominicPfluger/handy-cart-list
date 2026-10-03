# Bildfunktionen im Produkt-Bearbeiten-Dialog vollständig anzeigen

## Ziel
Beim Bearbeiten eines Produkts sollen Icon, grosses Vorschaubild und sämtliche zugehörigen Aktionen vollständig sichtbar und bedienbar sein – auch auf kleinen Bildschirmen und bei aufgeklappten KI-Bild-Optionen.
Auch beim kleinen Icon sollen die KI-Bild-Optionen direkt sichtbar und separat einstellbar sein.

## Umsetzung
1. **Dialoge vereinheitlichen:** Die Produktbearbeitung aus Listen- und Kachelansicht soll denselben Bildbereich anbieten. Im Listen-Dialog fehlen derzeit die Bildaktionen; dort wird das bestehende Bildwerkzeug für Icon und Vorschaubild erreichbar gemacht, statt eine zweite, abweichende Bildbearbeitung aufzubauen.
2. **Abgeschnittenen Bildbereich beheben:** Der Bild-Dialog der Kachelansicht hat derzeit keine Höhenbegrenzung oder eigenen Scrollbereich. Seine Inhalte erhalten eine bildschirmgerechte Höhe, vertikales Scrollen und genügend Platz für untere Aktionen und aufgeklappte KI-Optionen. Bildauswahl und Grossansicht bleiben darüber erreichbar.
3. **Schmale Ansichten prüfen:** Vorschau, Icon, Auswahl- und KI-Knöpfe dürfen nicht seitlich aus dem Dialog ragen. Ihre Anordnung wird auf schmalen Bildschirmen angepasst, ohne bestehende Bildfunktionen oder die Bestätigung vor KI-Credits zu verändern.
4. **KI-Optionen beim Icon:** Unter „Icon (klein)“ dieselben aufklappbaren Optionen wie beim Vorschaubild anzeigen: Stichworte, Stil, Hintergrund, Ansicht und Anzahl. Icon und Vorschaubild erhalten getrennte Einstellungen; die jeweilige KI-Aktion verwendet nur die Optionen ihres Bereichs. Standardwerte und Credits-Bestätigung bleiben bestehen.

## Technische Hinweise
- Betroffen sind die bestehenden Admin-Dialoge in `src/routes/_authenticated/admin.tsx` und `src/components/admin/catalog-tile-editor.tsx`; Bildspeicherung und KI-Aufrufe bleiben unverändert.
- Wenn der Listen-Dialog das bestehende Bildwerkzeug öffnet, wird nach einer Änderung der Admin-Katalog und die Vorschau aktualisiert.
- Browser-Prüfung in Listen- und Kachelansicht bei schmaler und breiter Anzeige: Produkt bearbeiten, beide KI-Optionsbereiche unabhängig aufklappen und einstellen, Bildaktionen erreichen und bis zum unteren Dialogende scrollen. KI-Erzeugung nur bis zur Credits-Bestätigung prüfen und dort abbrechen.
