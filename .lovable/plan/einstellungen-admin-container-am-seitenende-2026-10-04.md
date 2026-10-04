# Einstellungen: Admin-Container am Seitenende

## Ist-Zustand (geprüft)
In `src/routes/mehr.tsx` existieren die beiden Admin-Links „Katalog verwalten" (`/admin`) und „Feedback-Posteingang" (`/feedback-admin`) bereits — sie hängen aber am Ende des Abschnitts „Darstellung & Vorlesen" (Zeilen 281–305). Beide sind bereits hinter `useIsAdmin()` (serverseitige `has_role`-Prüfung) verborgen.

## Änderung
- Beide Admin-Links aus dem Abschnitt „Darstellung & Vorlesen" entfernen.
- Neuen eigenen Container (gleiche Karten-Optik wie die anderen Abschnitte: `rounded-2xl border bg-card`, Zeilen mit Trennlinien) ganz am Schluss der Einstellungen einfügen — direkt vor dem Footer.
- Der Container erscheint nur, wenn `isAdmin` true ist (eingeloggter Admin); für alle anderen bleibt die Seite unverändert.
- Inhalt unverändert: „Katalog verwalten" → `/admin`, „Feedback-Posteingang" → `/feedback-admin` inkl. Feedback-Badge (Zähler offener Meldungen).

## Technik
- Nur `src/routes/mehr.tsx`: die beiden `{isAdmin && (...)}`-Blöcke verschieben, keine neuen i18n-Schlüssel (vorhandene `more.admin`, `more.adminSub`, `fb.inbox`, `fb.inboxSub` wiederverwenden).
- Prüfung: `bunx tsgo --noEmit`, Build-Log, Browser-Check als Admin (Container sichtbar am Ende) und ohne Admin-Session (Container nicht vorhanden).
