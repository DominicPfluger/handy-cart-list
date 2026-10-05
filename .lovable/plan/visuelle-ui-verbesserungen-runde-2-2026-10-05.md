# Visuelle UI-Verbesserungen — Runde 2

Aus deinen Antworten umgesetzt werden: freundlicher leerer Zustand (Listenübersicht), Produkt-Bildavatare schärfen, Bild-Platzhalter garantieren, Dark Mode.

## 1. Freundlicher leerer Zustand (Listenübersicht)

- `src/routes/index.tsx`: Der Vorlagen-Bereich zeigt bei leeren Vorlagen statt des blossen Hinweistexts eine kleine Karte mit grossem 📋-Symbol, Titel „Noch keine Vorlagen" und dem bestehenden Hinweistext als Untertext.
- Falls gar keine Liste existiert: gleicher freundlicher Block (🧺-Symbol, Einladung, „Erstellen" bleibt) statt leerem Rahmen.
- Neue i18n-Schlüssel (Titel) in `src/i18n/de.ts` + allen 15 Locale-JSONs.

## 2. Produkt-Bildavatare schärfen (Einkaufsliste)

- Die Zeilen zeigen bereits Produktbilder (Icon-Set „Bilder"): Bild wenn vorhanden, sonst Symbol.
- Polish: Avatar minimal grösser (9×9, abgerundet), Bild sauber eingebettet auf dezenter Abteilungs-Farbe; nichts am Zeilenlayout oder an der Logik ändern.

## 3. Bild-Platzhalter garantieren

- Kette `CachedImage → ProductIcon/DepartmentIcon → ProductEmoji` durchprüfen: Bei fehlendem oder fehlerhaftem Bild muss immer ein sauberes Symbol erscheinen (🛒/🧺 bzw. Produkt-Emoji) — nie ein leerer Kastchen (betrifft Einkaufsliste, Abteilungs-Kacheln, Überschriften-Icons, Artikel-Fotos `item-photo.tsx`).
- Die leeren Kästchen im Testbrowser sind fehlende Emoji-Schrift des Testbrowsers, kein App-Fehler — auf dem iPhone/Android rendern sie korrekt. Trotzdem: Produkte ohne Emoji und ohne Bild bekommen garantiert den 🛒-Fallback.

## 4. Dark Mode (automatisch + Umschaltung)

- `src/styles.css`: Neuer `.dark { … }`-Block mit dunklen Werten für alle semantischen Tokens (background, card, popover, muted, border, input, primary-soft …). Die Kategoriefarben sind CSS-Variablen (`--cat-*`) — sie bekommen entsättigte, dunkel getönte Varianten im `.dark`-Block und passen sich dadurch überall automatisch an.
- Neuer Hook `src/hooks/use-theme.ts`: Auswahl „System / Hell / Dunkel", geräte-lokal in `shoppi:theme` gespeichert, setzt die Klasse `.dark` auf `<html>`; bei „System" folgt er der Systemeinstellung live.
- Initialisierung in `src/routes/__root.tsx` (neben Sprache/Schriftgrösse); die `theme-color`-Meta wechselt mit.
- Einstellungen: Neue Zeile „Darstellung" mit drei Segment-Buttons (System/Hell/Dunkel) in der App-Gruppe beim Icon-Set (`src/routes/mehr.tsx`); Texte in allen 16 Sprachen.
- Audit in Dark: Landingpage, Adminbereich, Overlays und Bottom-Navigation auf Kontrast prüfen und Token-Fehler fixen.

## Umsetzung & Test

- Typprüfung `bunx tsgo --noEmit`, Build-Fehlerlog kontrollieren.
- Playwright-Check: Vorlagen-Leerzustand sichtbar, Dark-Umschaltung (hell/dunkel/system) wechselt die Farben app-weit, Listenzeilen-Avatare korrekt.
- Testliste „Edeka" danach wieder in den Originalzustand bringen (0/4 abgehakt).
