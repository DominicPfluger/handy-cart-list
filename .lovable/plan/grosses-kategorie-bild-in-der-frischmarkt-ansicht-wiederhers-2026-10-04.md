# Grosses Kategorie-Bild in der Frischmarkt-Ansicht wiederherstellen

## Befund

- Die Kategorie „Frische Pilze" hat weiterhin ein grosses Bild in der Datenbank (`departments/367876d9-….png`), und die Datei existiert auch im Speicher.
- Am 3.10. wurde zusätzlich ein kleines Icon für die Kategorie erzeugt (`department-icons/…webp`).
- Die Kategorie-Kacheln in der Abteilungsansicht (`DepartmentThumb` in `src/routes/abteilungen.tsx`, Zeile 65) zeigen bevorzugt das kleine Icon (`iconUrl ?? imageUrl`). Seit das Icon existiert, ersetzt es das grosse Bild auf der Kachel — darum ist das grosse Pilzbild „verschwunden".

## Umsetzung

1. **Kacheln zeigen wieder das grosse Bild:** In `DepartmentThumb` die Reihenfolge umkehren zu `imageUrl ?? iconUrl` (grosses Bild bevorzugt, kleines Icon als Ersatz, Emoji als letzter Fallback). Damit erscheinen in der Frischmarkt-Kategorienansicht (und allen anderen Abteilungen) wieder die grossen Kategorie-Bilder.
2. **Kleine Icons bleiben erhalten:** Listenansicht, Favoriten und andere Stellen, die bewusst das kleine Icon nutzen, bleiben unverändert.
3. **Prüfung:** Im Browser die Frischmarkt-Ansicht öffnen und kontrollieren, dass die Pilze-Kachel wieder das grosse Bild zeigt; Typprüfung und Build laufen lassen.

## Technische Details

- Einzige Code-Änderung: `src/routes/abteilungen.tsx`, Funktion `DepartmentThumb` (eine Zeile).
- Keine Datenbank- oder Speicher-Änderung nötig — die Bilddateien sind vorhanden.
