# Farbige Kategorien in der Abteilungsansicht

## Ziel
Die Kacheln der Hauptkategorien (oberste Ebene auf „Abteilungen") bekommen je eine eigene, zum Inhalt passende Pastellfarbe statt des heute einheitlichen grünen Hintergrunds (`bg-primary-soft/25`).

## Farbvorschläge pro Hauptkategorie

| Kategorie | Farbe | Hex (Hintergrund) |
|---|---|---|
| 🥬 Frischmarkt | Frisches Grün | `#DCF2E0` |
| 🥛 Milchprodukte & Eier | Cremeweiss/Elfenbein | `#F6F1E7` |
| 🍖 Fleisch & Fisch | Zartes Lachsrosa | `#F8E0DC` |
| 🧺 Frisch-Produkte & Delikatessen | Warmes Apricot | `#FCEBD8` |
| 🥐 Backwaren & Frühstück | Weizen/Goldgelb | `#F9EFD2` |
| 🫙 Vorräte | Honig/Ocker | `#F3E5C8` |
| 🧂 Kochzutaten | Terrakotta-Hell | `#F5DFD3` |
| 🧊 Tiefkühlprodukte | Eisblau | `#DCEEF7` |
| 🥤 Getränke | Aquamarin | `#D9F0EC` |
| 🥨 Salzige Snacks | Sand/Paprika-Orange | `#FAE6D2` |
| 🍬 Süsses | Bonbonrosa | `#F9E0EC` |
| 🧼 Körperpflege | Flieder/Lavendel | `#EAE4F5` |
| 🧽 Haushalt | Frisches Mintblau | `#DFF0F3` |
| ⚕️ Apotheke & Drogerie | Salbeigrün | `#E2EFE6` |
| 🐾 Tierbedarf | Warmes Karamell | `#F0E4D4` |
| 📎 Büroartikel | Stahlblau-Grau | `#E3E8EF` |
| 🚬 Tabak & Dampfen | Gedämpftes Graubraun | `#E8E2DC` |
| 👕 Kleidung & Textilien | Jeansblau-Hell | `#E0E8F4` |
| 🍳 Küchenutensilien | Kupfer-Hell | `#F2E3D8` |
| 🚗 Autozubehör | Anthrazit-Hell | `#E4E6E9` |

Alle Farben sind bewusst hell und pastellig, damit Emoji/Bild und schwarzer Text gut lesbar bleiben und das grüne Design der App nicht konkurrenziert wird.

## Umsetzung (technisch)

1. **Neue Farbtokens** in `src/styles.css`: 20 Kategorie-Tokens als oklch-Werte (z. B. `--cat-frischmarkt`), dazu je eine leicht dunklere Variante für den Kachel-Rand oder Hover.
2. **Mapping** in einer neuen Datei `src/lib/dept-colors.ts`: Zuordnung Kategorie-ID bzw. Basisname → Farb-Token. Unterkategorien erben die Farbe ihrer obersten Hauptkategorie, damit die ganze Ebene stimmig bleibt.
3. **Kacheln in `src/routes/abteilungen.tsx`**: Der Bild-/Emoji-Bereich der Kachel (heute `bg-primary-soft/25`) bekommt die Kategoriefarbe; auf der Hauptebene die eigene Farbe, in Unterebenen die geerbte Farbe der Wurzelkategorie.
4. **Einkaufsliste (`src/routes/index.tsx`)**: Die Gruppen-Emoji-Kästchen in der Liste bekommen dieselbe Kategoriefarbe, damit die Farben beim Einkaufen wiedererkannt werden.
5. **Dark Mode**: Für jedes Token eine abgedunkelte Variante im `.dark`-Block, damit die Kacheln auch im dunklen Design stimmig aussehen.

## Nicht im Umfang
- Keine Farb-Auswahl durch den Nutzer (feste Zuordnung).
- Keine Änderung an Produktbildern, Icons oder Sortierung.

## Prüfung
- Vorschau: Abteilungs-Hauptansicht und eine Unterebene öffnen, Farben und Lesbarkeit prüfen (hell + dunkel).
- Build-Fehlerprotokoll kontrollieren.
