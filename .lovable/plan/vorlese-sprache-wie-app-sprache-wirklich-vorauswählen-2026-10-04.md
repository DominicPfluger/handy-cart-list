# Vorlese-Sprache: „Wie App-Sprache" wirklich vorauswählen

## Ausgangslage
Die Einstellung ist im Code bereits auf „Wie App-Sprache" (`shoppi:speak-locale` = `"app"`) voreingestellt. Geräte, die vorher einmal eine konkrete Sprache gespeichert haben (z. B. Deutsch), behalten diesen gespeicherten Wert — dort zeigt das Dropdown weiterhin die alte Sprache statt „🌐 Wie App-Sprache". Das betrifft vor allem dein eigenes Gerät.

## Änderung
**Datei:** `src/hooks/use-speak-locale.ts`

Einmalige Gerät-Migration beim Laden:
- Wenn `shoppi:speak-locale` einen gespeicherten Wert enthält **und** das Merkmal `shoppi:speak-locale-migrated` noch nicht gesetzt ist:
  - gespeicherten Wert löschen (Einstellung fällt auf „Wie App-Sprache" zurück),
  - Merkmal `shoppi:speak-locale-migrated` setzen.
- Wählt man danach wieder eine Sprache aus, bleibt diese dauerhaft erhalten (Migration läuft nur einmal).

Keine Änderung an UI, Übersetzungen oder Datenbank.

## Verifikation
- Browser-Test: auf „Mehr" zeigt das Dropdown „Vorlese-Sprache" standardmässig „🌐 Wie App-Sprache"; nach manueller Wahl bleibt die gewählte Sprache auch nach Neuladen erhalten.
- Typprüfung (`bunx tsgo --noEmit`) und Build fehlerfrei.
