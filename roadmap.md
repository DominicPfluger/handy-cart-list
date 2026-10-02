# Roadmap

- [x] Rezept-Generator: Zutaten-Ebenen mit Emoji, Untergruppen inline, zehn Produkte je Ebene mit „Weitere anzeigen“; nur manuell zugeordnete Produkte in verwalteten Vorlagen.
- [x] Rezept-Generator: KI-Bilder für die acht Vorlagen (Kacheln, Titel hinter dem Text, Fallback in Rezeptkarten); Emoji bleibt Fallback für Admin-Vorlagen ohne Bild.
- [x] Rezept-Generator: Graue Zutatenkategorien mit Pfeilen in einer seitlich scrollbaren Zeile; Zutaten nach Klick darunter sichtbar. Zutatenbereiche der gewählten Vorlage direkt im Admin-Panel verwalten.
- [x] Admin-Rezeptverwaltung: Vorlagenverwaltung, Oberkategorien, Rezept-Kategorien und Zutatenlisten je Oberkategorie unabhängig aufklappbar; Eingaben bleiben beim Zuklappen erhalten.

Priorisierte Verbesserungen (Plan vom 2.10.2026 genehmigt):

- [x] 1. Schriftgrösse einstellbar (Mehr): Klein/Normal/Gross, gerätelokal (shoppi:font-size) — Browser-Test: 18px, bleibt nach Reload
- [x] 2. Schneller erfassen & abhaken: Schnell-Chips aus Kauf-Historie, Mengen +/− am Eintrag, Einkaufs-Modus mit Wake Lock — Browser-Test OK
- [x] 3. Foto pro Listeneintrag: IndexedDB lokal, WebP ≤200 KB, Tipp = gross — Browser-Test: Aufnahme, Miniatur, Grossansicht, Löschen OK
- [x] 4. Portionen-Rechner (Rezepte): 1–8 Portionen, Mengen skalieren, auch beim Übernehmen auf die Liste — Browser-Test: 500 g → 1500 g bei 3 Portionen, addAll skaliert mit
- [ ] 5. Katalog-Gesundheit (Admin): Zähler ohne Bild/Preis/Übersetzung/Dubletten, klickbar
- [ ] 6. Schnellerer Start: Katalog in Häppchen laden

Alle i18n-Texte in de.ts + 15 Lokale (messages.json).
