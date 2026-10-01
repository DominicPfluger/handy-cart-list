# Gleiche Icons im Einladen- und Teilen-Dialog

## Ausgangslage
- Der **Teilen-Dialog** (`src/components/share-sheet.tsx`) verwendet echte Marken-Icons: WhatsApp, Telegram, Signal, Messenger, Discord, Threema (aus `simple-icons`) plus eigene Icons für SMS und E-Mail.
- Der **Einladen-Dialog** (`src/routes/mehr.tsx`) zeigt für dieselben Dienste nur generische Emojis: 💬 (WhatsApp), ✈️ (Telegram), 🔒 (Threema), 📱 (SMS), ✉️ (E-Mail).

## Ziel
Der Einladen-Dialog zeigt exakt dieselben Marken-Icons wie der Teilen-Dialog.

## Umsetzung
1. **Icons gemeinsam nutzbar machen:** Die Icon-Bausteine (`BrandIcon`, `MailIcon`, `SmsIcon`) aus `share-sheet.tsx` in ein gemeinsames Modul `src/components/share-icons.tsx` verschieben (Export), damit beide Dialoge dieselbe Quelle verwenden. `share-sheet.tsx` importiert sie von dort.
2. **Einladen-Dialog umbauen (`src/routes/mehr.tsx`):**
   - Emoji-Kacheln durch die Marken-Icons ersetzen: WhatsApp, Telegram, Threema je mit `BrandIcon` + dem passenden `simple-icons`-Pfad; SMS mit `SmsIcon`, E-Mail mit `MailIcon`.
   - Kachel-Stil (runde 14×14-Fläche, `bg-primary-soft/50`) bleibt gleich; Icons in `text-primary` wie im Teilen-Dialog.
   - „Link kopieren" (🔗) und „Mehr" (Teilen-Symbol) bleiben unverändert.
3. **Prüfung:** Build-Log kontrollieren; in der Vorschau Einladen-Dialog (Mehr → Gemeinsam → Einladen) und Teilen-Dialog öffnen und die Icons nebeneinander vergleichen.

## Technische Details
- Betroffene Dateien: `src/components/share-icons.tsx` (neu), `src/components/share-sheet.tsx`, `src/routes/mehr.tsx`.
- Keine neuen Abhängigkeiten (`simple-icons` ist bereits installiert), keine Übersetzungen nötig, keine Datenbankänderung.
