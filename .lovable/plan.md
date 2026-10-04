# Sprachausgabe: nur im Kaufmodus, dort schaltbar

## Ziel
Die Sprachausgabe wird aus der normalen Listenansicht entfernt. Nur der Kaufmodus behält sie — dort mit einem Schalter zum Ein-/Ausschalten. Wenn aktiv, nennt die Stimme den aktuellen Artikel mit Menge und Einheit (z. B. „2 Flaschen Milch").

## Umsetzung
1. **Listenansicht** (`src/routes/index.tsx`):
   - Vorlese-Button (SpeakListButton) aus der Listenansicht entfernen, inkl. zugehörigem Code/Imports.
   - Die Komponente `src/components/speak-list-button.tsx` bleibt bestehen, da `speakSentences` vom Kaufmodus genutzt wird; nur die Verwendung in der Liste entfällt.
2. **Kaufmodus** (`src/components/purchase-mode.tsx`) — Sprachausgabe schaltbar:
   - Lautsprecher-Button in der Kopfzeile neben dem Schliessen-X (Icon: Lautsprecher an/aus).
   - Zustand geräte-lokal: neuer localStorage-Schlüssel `shoppi:purchase-speak` (`"1"`/`"0"`), Standard: **an**.
   - Ausgeschaltet: kein Vorlesen, laufende Ausgabe stoppt sofort. Eingeschaltet: aktueller Artikel wird sofort vorgelesen.
   - Vorlese-Text bleibt: Menge + ausgeschriebene Einheit + Artikelname (via `speakQuantity`, Vorlese-Sprache/-Tempo aus den bestehenden Einstellungen).
3. **i18n**: neue Schlüssel `purchase.speakOn` / `purchase.speakOff` (aria-label/Titel) in `src/i18n/de.ts` und allen 15 Locales in `messages.json`; nicht mehr benötigte Listen-Vorlese-Schlüssel prüfen und ggf. entfernen.

## Technische Details
- Kein Server-/Datenbank-Eingriff, alles clientseitig.
- `speakSentences` wird zentral aus `speak-list-button.tsx` weiterverwendet (kein Code-Duplikat).

## Prüfung
- Browser-Test: Listenansicht ohne Vorlese-Button; Kaufmodus mit Schalter (aus/an, Icon-Wechsel, sofortiges Stoppen/Starten).
- Typecheck + Build.
