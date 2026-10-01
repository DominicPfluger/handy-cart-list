# Feedback-Formular mit Posteingang in der App

## Was du bekommst
- **„Feedback senden"** auf „Mehr" öffnet eine eigene Formular-Seite statt der E-Mail-App.
- Felder: **Name**, **E-Mail**, **Kategorie** (Fehler melden, Idee/Wunsch, Frage, Lob, Sonstiges) und **Nachricht**.
- Pflichtfelder werden geprüft (gültige E-Mail, Nachricht 10–2000 Zeichen). Nach dem Absenden kommt eine Bestätigung.
- Ist man angemeldet, sind Name und E-Mail schon vorausgefüllt. Absenden geht auch ohne Anmeldung.
- **Posteingang nur für dich (Admin):** Auf „Mehr" erscheint für dich der neue Eintrag „Feedback-Posteingang" mit einer Zahl für ungelesene Nachrichten. Dort siehst du alle Anfragen, neueste zuerst. Du kannst nach Kategorie filtern, Nachrichten als gelesen/erledigt markieren, löschen oder per Tipp auf die E-Mail direkt antworten.
- Alle Beschriftungen werden in die 16 Sprachen übersetzt.

## Technische Details
- Migration: Tabelle `feedback_messages` (id, user_id nullable, name, email, category text, message, status `neu|gelesen|erledigt`, locale, created_at), GRANT INSERT an anon/authenticated, SELECT/UPDATE/DELETE an authenticated, ALL an service_role. RLS: INSERT für alle (mit Längenprüfung), SELECT/UPDATE/DELETE nur `has_role(auth.uid(),'admin')`.
- Validierung mit zod im Formular und Längen-Checks in der Policy.
- Neue Routen: `/feedback` (Formular, öffentlich) und `/_authenticated/feedback-admin` (Posteingang, prüft Admin-Rolle, sonst Hinweis).
- `mehr.tsx`: Feedback-Link auf `/feedback`; Admin-Zeile „Feedback-Posteingang" mit Zähler.
- Neue Schlüssel `fb.*` in `de.ts` + `messages.json`; head-Metadaten für neue Seiten.
- Keine E-Mail-Benachrichtigung (kann später ergänzt werden).
