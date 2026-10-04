# Sprachausgabe im Kaufmodus schaltbar machen

## Ziel
Im Kaufmodus der Listenansicht lässt sich die Sprachausgabe ein- und ausschalten. Wenn aktiv, nennt die Stimme den aktuellen Artikel mit Menge und Einheit (z. B. „2 Flaschen Milch").

## Ist-Zustand
Der Kaufmodus (`src/components/purchase-mode.tsx`) liest den aktuellen Artikel bereits automatisch vor — ohne Möglichkeit, das abzustellen. Der Sprechtext (Menge + ausgeschriebene Einheit + Name) wird in `src/routes/index.tsx` über `speakQuantity` erzeugt und ist korrekt.

## Umsetzung
1. **Schalter im Kaufmodus** (`src/components/purchase-mode.tsx`):
   - Lautsprecher-Button in der Kopfzeile neben dem Schliessen-X (Icon: Lautsprecher an/aus).
   - Zustand geräte-lokal speichern: neuer localStorage-Schlüssel `shoppi:purchase-speak` (`"1"`/`"0"`), Standard: **an**.
   - Ausgeschaltet: kein Vorlesen, laufende Ausgabe wird sofort gestoppt.
   - Eingeschaltet: aktueller Artikel wird sofort vorgelesen.
2. **Vorlese-Text** bleibt wie bisher: Menge + Einheit (ausgeschrieben in der Vorlese-Sprache) + Artikelname — deckt die Anforderung „nennt Artikel und Einheit" ab.
3. **i18n**: neue Schlüssel `purchase.speakOn` / `purchase.speakOff` (aria-label/Titel) in `src/i18n/de.ts` und allen 15 Locales in `messages.json`.

## Technische Details
- Kein neuer Hook nötig; ein kleiner `useState` + localStorage-Sync in `purchase-mode.tsx` genügt (Muster wie `use-speak-rate`).
- Vorlese-Sprache und -Tempo kommen weiterhin aus den bestehenden Einstellungen (`useSpeakLocale`, `useSpeakRate`).
- Kein Server-/Datenbank-Eingriff.

## Prüfung
- Browser-Test: Kaufmodus öffnen, Schalter aus/an, Icon-Wechsel und sofortiges Stoppen/Starten der Ausgabe prüfen.
- Typecheck + Build.
