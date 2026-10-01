# Kategoriefarben umsetzen + Listen-Icons verkleinern

## Teil 1: Farbige Kategorien in der Abteilungsansicht (bereits genehmigt)

Die Kacheln der Hauptkategorien bekommen je eine eigene Pastellfarbe statt des einheitlichen grünen Hintergrunds.

| Kategorie | Farbe | Hex |
|---|---|---|
| 🥬 Frischmarkt | Frisches Grün | `#DCF2E0` |
| 🥛 Milchprodukte & Eier | Cremeweiss | `#F6F1E7` |
| 🍖 Fleisch & Fisch | Lachsrosa | `#F8E0DC` |
| 🧺 Frisch-Produkte & Delikatessen | Apricot | `#FCEBD8` |
| 🥐 Backwaren & Frühstück | Goldgelb | `#F9EFD2` |
| 🫙 Vorräte | Honig/Ocker | `#F3E5C8` |
| 🧂 Kochzutaten | Terrakotta-Hell | `#F5DFD3` |
| 🧊 Tiefkühlprodukte | Eisblau | `#DCEEF7` |
| 🥤 Getränke | Aquamarin | `#D9F0EC` |
| 🥨 Salzige Snacks | Sand-Orange | `#FAE6D2` |
| 🍬 Süsses | Bonbonrosa | `#F9E0EC` |
| 🧼 Körperpflege | Lavendel | `#EAE4F5` |
| 🧽 Haushalt | Mintblau | `#DFF0F3` |
| ⚕️ Apotheke & Drogerie | Salbeigrün | `#E2EFE6` |
| 🐾 Tierbedarf | Karamell | `#F0E4D4` |
| 📎 Büroartikel | Stahlblau-Grau | `#E3E8EF` |
| 🚬 Tabak & Dampfen | Graubraun | `#E8E2DC` |
| 👕 Kleidung & Textilien | Jeansblau-Hell | `#E0E8F4` |
| 🍳 Küchenutensilien | Kupfer-Hell | `#F2E3D8` |
| 🚗 Autozubehör | Anthrazit-Hell | `#E4E6E9` |

Umsetzung:
1. Farbtokens in `src/styles.css` (oklch), inkl. abgedunkelter Varianten für den Dark Mode.
2. Neues Mapping `src/lib/dept-colors.ts`: Hauptkategorie → Farbe; Unterkategorien erben die Farbe ihrer Wurzelkategorie.
3. Kacheln in `src/routes/abteilungen.tsx`: Bild-/Emoji-Bereich (heute `bg-primary-soft/25`) erhält die Kategoriefarbe.
4. Einkaufsliste (`src/routes/index.tsx`): Gruppen-Emoji-Kästchen erhalten dieselbe Kategoriefarbe zur Wiedererkennung.

## Teil 2: Listen-Icons verkleinern (neu)

Die Emoji-/Bild-Kästchen in der Einkaufsliste (`src/routes/index.tsx`, heute `h-10 w-10` mit `text-xl`) werden etwas verkleinert: Kästchen auf `h-9 w-9`, Emoji auf `text-lg`. Gleiche Verkleinerung auf der Favoriten-Seite, falls dort dieselbe Kästchengrösse verwendet wird.

## Prüfung
- Vorschau: Abteilungs-Hauptansicht, eine Unterebene und die Einkaufsliste öffnen; Farben, Lesbarkeit (hell + dunkel) und Icongrösse kontrollieren.
- Build-Fehlerprotokoll kontrollieren.
