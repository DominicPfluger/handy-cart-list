# Popup beim Listennamen entfernen — nur noch beim Erstellen anzeigen

## Ausgangslage
In der Listen-Einzelansicht öffnet ein Tipp auf die Listenbezeichnung momentan das Popup
„Listen bearbeiten" (ListManager: alle Listen, Umbenennen, Löschen, Vorlagen, Erstellen-Formular).
Das ist unerwünscht — das Popup soll nur noch beim Erstellen einer neuen Liste erscheinen.

## Änderungen — `src/routes/index.tsx`

1. **Listenbezeichnung in der Einzelansicht entkoppeln** (ca. Zeile 475):
   Der `<button onClick={() => setManagerOpen(true)}>` um Titel und Laden-Zeile wird zu einem
   nicht klickbaren Block (`<div>` mit gleichen Klassen). Aussehen bleibt identisch; ein Tipp
   auf den Listennamen öffnet kein Popup mehr.

2. **Nicht mehr erreichbares Popup in der Einzelansicht entfernen**:
   Das zweite `ListManager`-Instanz im Detail-View (ca. Zeile 438) wird samt `managerOpen`-
   Verwendung dort entfernt, da es nur über den Listennamen-Tipp erreichbar war.

3. **Erstellen bleibt wie es ist**: Der „+ Neue Liste"-Button in der Listenübersicht öffnet
   weiterhin das Popup mit dem Erstellen-Formular (inkl. Laden-Auswahl und „+ Neuer Laden").

## Verifikation
- Typprüfung (`bunx tsgo --noEmit`).
- Browser-Check: Tipp auf den Listennamen in der Einzelansicht öffnet kein Popup;
  „+ Neue Liste" in der Übersicht öffnet das Popup weiterhin; bestehende Funktionen
  (Umbenennen/Löschen/Vorlagen in der Übersicht) bleiben unverändert.
