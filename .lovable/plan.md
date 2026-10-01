# Vorlesen in allen 16 Sprachvarianten

## Ziel
Die Einkaufsliste kann in jeder der 16 Lokalisierungen vollständig und natürlich vorgelesen werden – Ansagen, Kategorien, Produktnamen, Mengen und Einheiten.

## Was sich ändert
- **Vorlese-Sprache unter „Mehr"**: Alle 16 Varianten wählbar (bleibt so), neu mit Option **„Wie App-Sprache"**. Standard bleibt Deutsch.
- **Vollständige Texte pro Sprache**: Einleitung, „Liste ist leer", Kategorie-Satz und Abschluss erhalten für jede Sprache eingebaute, natürlich formulierte Standardtexte (inkl. Einzahl/Mehrzahl, z. B. „1 Artikel" / „3 Artikel").
- **Mengen & Einheiten** werden in der Vorlese-Sprache ausgesprochen (z. B. „2 Flaschen", „2 bottles", „2 bouteilles") statt als Kürzel.
- **Regionale Begriffe**: Produkt- und Kategorienamen kommen aus den bestehenden Übersetzungen der jeweiligen Region (z. B. de-CH „Rahm", ss statt ß).
- **Passende Stimme**: Die App sucht zuerst eine Stimme für die exakte Region (fr-CA), dann für die Sprache (fr), sonst Hinweis „Für diese Sprache ist auf deinem Gerät keine Stimme installiert".
- **Admin „Vorlese-Texte"**: Übersicht zeigt pro Sprache, ob eigene Texte gesetzt sind; Button „Probehören" pro Sprache. Eigene Texte überschreiben weiterhin die Standardtexte.

## Technische Details
- `use-speak-locale.ts`: Wert `"app"` zusätzlich speichern; Auflösung auf aktuelle App-Locale.
- `speech-texts.ts`: Standardtexte je Locale über i18n-Keys `speak.intro`, `speak.introOne`, `speak.empty`, `speak.group`, `speak.outro`, `speak.noVoice` in `de.ts` + allen 15 Locales in `messages.json`.
- Einheiten-Aussprache: neue Keys `speak.unit.<unit>.one/other` für alle gültigen Einheiten und Locales; Formatierung in `speak-list-button.tsx`.
- Stimmenwahl: exakter BCP-47-Treffer → Sprachpräfix → keine Stimme (Hinweis), `voiceschanged` abwarten.
- Keine Datenbankänderung nötig (`speech_texts` hat bereits `locale`).
