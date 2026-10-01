# Push-Benachrichtigungen für Rezepte + Kategorien in den Generator-Rahmen

## Teil 1: Kategorien innerhalb des Rezept-Generator-Rahmens (Rezepte-Seite)

`src/routes/rezepte.index.tsx`: Die 8 Kategorie-Kacheln (Müsli, Smoothie, …) wandern in den umrandeten 🧑‍🍳 Rezept-Generator-Block. Der Block wird ein umrandeter Container (`rounded-2xl border bg-card p-4`); die Kopfzeile (Icon, Titel, Beschreibung) bleibt ein Link zum Generator, darunter liegen die 8 Kategorie-Kacheln im selben Rahmen (jede Kachel eigener Link mit `?cat=…`). Keine verschachtelten Links. Rezept-Listen und Rezept-Inspirationen bleiben darunter unverändert.

## Teil 2: Push-Benachrichtigungen

### Ziel
1. **Neues Rezept mit meinen Lieblingszutaten** — wenn jemand ein öffentliches Rezept veröffentlicht, das mindestens einen Artikel aus meiner Favoritenliste enthält, bekomme ich eine Push-Mitteilung.
2. **Kommentar auf meinem Rezept** — wenn jemand mein öffentliches Rezept kommentiert, bekomme ich eine Push-Mitteilung.

### Voraussetzung: Firebase Cloud Messaging (Push-Dienst)
- Firebase-Connector verbinden (Karte im Chat; der Nutzer bestätigt dort). Variante **Web-Push inklusive** wählen, da Shoppi eine Web-App/PWA ist — dafür braucht der Connector die Firebase-Web-Einstellungen (API-Key, App-ID, VAPID-Key), die im Verbindungs-Formular eingetragen werden.
- Alle Gateway-Aufrufe laufen über den Lovable-Connector-Gateway aus Server-Code; es gibt nie Firebase-Zugangsdaten im Browser.

### Datenbank (Migration)
- Neue Tabelle `push_subscriptions`: Geräte-Registrierung pro Nutzer mit `device_token`, `locale`, `favorite_product_ids` (uuid[]), Schaltern `notify_new_favorites` / `notify_comments`, Zeitstempel. RLS: jeder Nutzer verwaltet nur seine eigenen Zeilen; GRANTs + Policies in derselben Migration.
- Triggers mit `pg_net` rufen bei zwei Ereignissen die Server-Route:
  - `recipes`: Veröffentlichung (`is_public` wird wahr) → Rezept-ID an die Route.
  - `recipe_comments`: neuer Kommentar → Kommentar-ID an die Route.
  (Triggers statt App-Code, weil Veröffentlichen und Kommentieren direkt in der Datenbank landen — so wird kein Weg vergessen.)

### Server-Route (Webhook)
- `src/routes/api/public/webhooks/recipe-events.ts` (unter `/api/public/`, externer Aufrufer) — prüft einen gemeinsamen geheimen Schlüssel, bevor etwas verarbeitet wird.
- Neues Rezept: vergleicht `product_ids` des Rezepts mit den gespeicherten Lieblings-Produkt-IDs aller angemeldeten Geräte; Autor wird ausgeschlossen; pro Treffer eine FCM-Nachricht in der Sprache des Geräts.
- Kommentar: sucht den Rezept-Besitzer und sendet an dessen Geräte (sofern `notify_comments` aktiv).
- FCM-Versand über den Connector-Gateway; Fehler werden protokolliert, blockieren die App aber nicht.

### App (Client)
- Neue Datei `src/lib/push.ts`: Firebase-Client initialisieren, Berechtigung anfragen (nur auf echten Nutzer-Klick — im Lovable-Vorschau-Rahmen zeigt die App den Hinweis, die App in einem eigenen Tab zu öffnen), Token registrieren, `firebase-messaging-sw.js` (Service Worker) mit den Connector-Variablen per Query-String.
- Synchronisation: nach der Registrierung und bei jeder Favoriten-Änderung (entprellt) werden Lieblings-Produkt-IDs und die beiden Schalter an `push_subscriptions` geschickt (authentifizierte Server-Funktion). Anonyme Nutzer ohne Konto: Push erfordert Anmeldung (Besitzer eines Rezepts/Favoriten muss identifizierbar sein).
- „Mehr" → Mitteilungs-Einstellungen: zwei neue Schalter „Neue Rezepte mit meinen Lieblingszutaten" und „Kommentare zu meinen Rezepten"; darunter ein Knopf „Push aktivieren", der die Berechtigung abfragt und das Gerät registriert.
- Vordergrund-Anzeige: eingehende Pushs werden im offenen Tab als Hinweis eingeblendet; im Hintergrund übernimmt der Service Worker.

### Übersetzungen
- Neue Texte (Schalter, Aktivierungs-Knopf, Hinweis eigene Tab, Push-Titel/-Text für beide Ereignisse) in `src/i18n/de.ts` + `messages.json` für alle 16 Sprachen.

### Reihenfolge
1. Kategorien in den Generator-Rahmen (Teil 1).
2. Firebase-Connector verbinden (Karte im Chat).
3. Migration + Triggers.
4. Webhook-Route + Versand-Logik (Geheimnis via Secrets-Tool, URL an die Trigger übergeben).
5. Client-Registrierung, Synchronisation, Einstellungen, Übersetzungen.
6. Build + Vorschau-Check (Push-Versand selbst lässt sich in der Sandbox nur begrenzt testen; Registrierung, Synchronisation und Webhook-Logik werden geprüft).

Keine Änderung an bestehenden Rezept-Daten; Favoritenliste bleibt auf dem Gerät und wird nur (Produkt-IDs) für den Abgleich synchronisiert.
