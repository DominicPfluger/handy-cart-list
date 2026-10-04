# Neuer-Laden-Textfeld verbreitern (Listenansicht)

## Ausgangslage
Im Dialog „Meine Listen“ (Listenansicht → „+ Neue Liste“/„Create“) erscheint beim Wählen von „+ Neuer Laden“ eine Zeile mit Icon-Feld, Name-Textfeld und „Hinzufügen“-Button. Diese Zeile liegt innerhalb der linken Spalte (neben dem grossen „Erstellen“-Button) und ist deshalb schmaler als der Dialog; rechts vom „Hinzufügen“-Button bleibt Platz ungenutzt.

## Änderung
Nur `src/components/list-manager.tsx`, rein Layout, keine Funktionsänderung:

- Der Block `{newStore === "__new__" && …}` (Icon-Feld, Name-Textfeld, „Hinzufügen“-Button, Emoji-Vorschläge) wird aus der linken Spalte herausgelöst und direkt unterhalb der Erstellen-Zeile gerendert — über die volle Dialogbreite.
- Das Name-Textfeld behält `flex-1` und streckt sich damit über die gesamte Breite zwischen dem linken Icon-Feld und dem „Hinzufügen“-Button, der nun am rechten Rand steht.
- Emoji-Vorschlagsleiste bleibt unterhalb, linksbündig.

## Umfang
- Betrifft nur das „Neuer Laden“-Formular im „Meine Listen“-Dialog (Listenansicht). Die gleichen Formulare unter Favoriten und in den Einstellungen bleiben unverändert.

## Prüfung
- Typprüfung (`bunx tsgo --noEmit`).
- Browser-Check: Dialog öffnen, „+ Neuer Laden“ wählen, Textfeld füllt die Breite zwischen Icon und „Hinzufügen“-Button (Screenshot). Ohne Testdaten im Konto zu hinterlassen.
