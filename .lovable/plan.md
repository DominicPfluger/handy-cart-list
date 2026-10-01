# App-Info am Ende der „Mehr"-Seite

## Ziel
Am unteren Ende der Seite „Mehr" erscheint ein zentrierter App-Info-Block:
- grünes Shoppi-App-Icon (rund, ca. 64 px — dasselbe Bild wie im Splashscreen)
- App-Name „Shoppi"
- Claim/Tagline (lokalisiert, z. B. „Gemeinsam.Einfach.Einkaufen.")
- Versionsnummer, z. B. „Version 1.0.0"
- Copyright, z. B. „© 2026 Shoppi"

Der bisherige kleine Tagline-Fuss am Seitenende (Zeilen 330–333 in mehr.tsx) entfällt — er geht im neuen Block auf.

## Umsetzung

1. **Versionsnummer zentral pflegen**
   - `APP_VERSION = "1.0.0"` als Konstante in `src/lib/app-version.ts` (ein Ort für künftige Updates; Versionsnummern/Claim bleiben bewusst unübersetzt).

2. **App-Info-Block in `src/routes/mehr.tsx`**
   - Neuer Abschnitt ganz unten (nach dem „Nachhaltigkeit"-Block bzw. den versteckten Kategorien):
     ```text
     [Icon]  (img aus src/assets/app-icon.png.asset.json, rund)
     Shoppi            (font-semibold)
     <lokalisierter Claim>
     Version 1.0.0     (klein, gedämpft)
     © 2026 Shoppi     (klein, gedämpft)
     ```
   - Alles zentriert, Abstand `pt-6`, Styles über bestehende Tokens (`text-muted-foreground` usw., keine harten Farben).
   - Der bestehende Tagline-Fuss (`more.tagline`) wird entfernt; der Claim im App-Info-Block nutzt denselben Schlüssel.

3. **Copyright lokalisiert**
   - Neuer Schlüssel `more.copyright` in `src/i18n/de.ts` + `messages.json` für alle 16 Sprachen („© 2026 Shoppi. Alle Rechte vorbehalten." usw.). Version ohne Übersetzung („Version 1.0.0" versteht jeder Markt).

4. **Prüfen**
   - Build fehlerfrei; Vorschau: Block erscheint ganz unten auf „Mehr", kein doppelter Tagline-Fuss.
