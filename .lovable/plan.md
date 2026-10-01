# Ausgeblendete Produkte im Menü „Mehr" nach „Mitteilungen"

## Ziel
Auf der Seite „Mehr" erscheint „Ausgeblendete Produkte" als Menüeintrag mit passendem Icon direkt unter „Mitteilungen" — im gleichen Stil wie die anderen Einträge (Angebote, Scanner, Vorrat …).

## Ist-Zustand (geprüft)
- `src/routes/mehr.tsx`: Der Menüblock (Zeilen 206–259) enthält u. a. `NotificationSettingsRow` (Mitteilungen) und `AllMarketsRow`.
- Die ausgeblendeten Produkte erscheinen heute erst weiter unten als eigener Abschnitt (Zeilen 261–274), ohne Icon, und nur wenn mindestens ein Produkt ausgeblendet ist.
- Texte existieren bereits in allen 16 Sprachen: `more.hiddenProducts`, `more.hiddenProductsHint`, `more.restore`.
- Icons im Menü: Mischung aus Lucide-Icons (`lucide-react`) und Emojis in grün getönten Kästchen (`bg-primary-soft/50`).

## Umsetzung
1. **Neuer Menüeintrag** in `src/routes/mehr.tsx` direkt nach `NotificationSettingsRow` (vor `AllMarketsRow`):
   - Icon: `EyeOff` aus `lucide-react` (durchgestrichenes Auge = ausgeblendet), im gleichen grünen Kästchen-Stil wie die anderen Einträge.
   - Titel: `more.hiddenProducts`, rechts daneben die Anzahl ausgeblendeter Produkte als kleine Zahl.
   - Der Eintrag wird immer angezeigt; bei 0 ausgeblendeten Produkten ist er dezent (deaktiviert bzw. Hinweis „keine").
2. **Aufklapp-Liste**: Tipp auf den Eintrag klappt darunter die Liste der ausgeblendeten Produkte auf (Name + „Wiederherstellen"-Knopf pro Produkt, bestehende `restoreProduct`-Logik). Erneuter Tipp klappt zu.
3. **Alten Abschnitt entfernen**: Der separate Abschnitt weiter unten (Zeilen 261–274) entfällt, da die Liste jetzt im Menüeintrag lebt.
4. „Ausgeblendete Abteilungen" bleibt unverändert.

## Technische Details
- Datei: `src/routes/mehr.tsx` (einzige Änderung).
- Neuer State: `hiddenOpen` (boolean) zum Auf-/Zuklappen.
- `useHiddenProducts()` und `restoreProduct` werden wie bisher verwendet.
- Keine neuen Übersetzungen nötig; kein Datenbank- oder Backend-Eingriff.

## Prüfung
- Build/Typecheck fehlerfrei.
- In der Vorschau: Eintrag erscheint unter „Mitteilungen", Aufklappen zeigt ausgeblendete Produkte, „Wiederherstellen" funktioniert.
