# Katalog-Icons: WebP-Kompression und intelligentes Vorladen

## Ziel
Katalog-Icons bleiben klein und werden in den zuletzt verwendeten Abteilungen bereits im Hintergrund geladen, bevor sie sichtbar werden.

## Umsetzung
- Den bestehenden 64-px-WebP-Export so absichern, dass Icons möglichst unter 8 KB bleiben und stets als WebP gespeichert werden.
- Im Bildcache eine gezielte Vorladefunktion für Icon-Pfade ergänzen; bereits gespeicherte Icons werden nicht erneut geladen.
- In der Abteilungsansicht die drei zuletzt geöffneten Kategorien geräte-lokal merken.
- Sobald Katalog und Bildadressen verfügbar sind, die Produkt- und Unterkategorie-Icons dieser drei Kategorien mit begrenzter Parallelität im Hintergrund laden.
- Das Vorladen bei Datensparmodus, Offline-Status oder langsamer Verbindung aussetzen.

## Prüfung
- Buildstatus kontrollieren.
- Abteilungsansicht öffnen und prüfen, dass Icons weiterhin korrekt erscheinen.
- Netzwerkverhalten prüfen: Hintergrund-Downloads nur für die drei gemerkten Kategorien, Cache-Treffer ohne erneuten Download.
