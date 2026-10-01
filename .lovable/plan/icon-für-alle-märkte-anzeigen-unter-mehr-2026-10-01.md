# Icon für „Alle Märkte anzeigen" unter „Mehr"

## Ausgangslage
Die Zeile „Alle Märkte anzeigen" (`AllMarketsRow` in `src/routes/mehr.tsx`, Zeile 482–486) nutzt die Komponente `NotificationToggle`, die kein Icon auf der linken Seite rendert. Alle anderen Einträge unter „Mehr" zeigen links ein Icon in einem abgerundeten Kachel-Feld (`h-10 w-10 rounded-xl bg-primary-soft/50`), z. B. 🏠, 🕘, ✎ oder Lucide-Icons.

## Änderung
1. `NotificationToggle` in `src/routes/mehr.tsx` um einen optionalen Prop `icon?: ReactNode` erweitern. Ist er gesetzt, wird links dieselbe Icon-Kachel wie bei den oberen Funktionen gerendert (`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft/50`, Inhalt `text-lg`).
2. `AllMarketsRow` übergibt als Icon 🌍 (passt zum Markt-Thema und zum Emoji-Stil der Nachbareinträge).
3. Alle anderen Aufrufe von `NotificationToggle` bleiben unverändert (kein Prop → kein Icon, wie bisher).

Kein Datenbank- oder i18n-Eingriff nötig; Texte bleiben wie sie sind.

## Verifikation
- Build fehlerfrei.
- Playwright-Check: /mehr öffnen, prüfen, dass „Alle Märkte anzeigen" links die 🌍-Kachel zeigt und der Schalter weiter funktioniert.
