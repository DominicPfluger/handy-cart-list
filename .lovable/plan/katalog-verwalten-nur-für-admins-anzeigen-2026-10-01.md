# „Katalog verwalten“ nur für Admins anzeigen

## Ziel
In den Einstellungen („Mehr“) erscheint der Eintrag „Katalog verwalten“ nur noch, wenn der angemeldete Nutzer Admin ist. Ausgeloggte Nutzer und normale Nutzer sehen ihn nicht mehr. Das Admin-Panel selbst bleibt zusätzlich durch die bestehende Anmeldung und Server-Prüfung geschützt — die Änderung ist eine Anzeige-Verbesserung, kein neuer Schutz.

## Aktueller Stand (geprüft)
- `src/routes/mehr.tsx` (Zeile ~197): Der Link „Katalog verwalten“ (`more.admin`) wird derzeit bedingungslos gerendert. Ausgeloggte Nutzer landen beim Antippen auf der Anmeldeseite.
- `src/hooks/use-is-admin.ts`: existiert bereits, wird z. B. in der Abteilungsansicht genutzt; fragt serverseitig den Admin-Status ab und cached das Ergebnis 5 Minuten.

## Umsetzung
1. In `src/routes/mehr.tsx` den bestehenden Hook `useIsAdmin()` einbinden.
2. Den „Katalog verwalten“-Link nur rendern, wenn `isAdmin` true ist. Solange die Prüfung läuft, bleibt der Eintrag ausgeblendet (kurz; Ergebnis ist gecached).
3. Keine Änderungen an i18n, Datenbank oder am Admin-Panel selbst — der Eintragstext bleibt unverändert.

## Verifikation
- `tsgo --noEmit` und Build fehlerfrei.
- Playwright-Check der Einstellungsseite ohne Anmeldung: Eintrag „Katalog verwalten“ nicht sichtbar; Admin-Ansicht (eingeloggter Haupt-Admin): Eintrag sichtbar.
