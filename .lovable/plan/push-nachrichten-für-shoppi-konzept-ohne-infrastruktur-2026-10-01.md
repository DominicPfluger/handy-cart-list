# Push-Nachrichten für Shoppi — Konzept (ohne Infrastruktur)

Vier Benachrichtigungsarten werden geplant. Die technische Einrichtung (Firebase-Verbindung, Geräte-Registrierung) folgt später in einem eigenen Schritt.

## 1. Listenänderungen (geteilte Listen)

- **Auslöser:** Ein Listenmitglied fügt Artikel hinzu, ändert sie oder hakt sie ab.
- **Text:** „Anna hat 3 Artikel zu „Wocheneinkauf" hinzugefügt" / „Anna hat „Milch" abgehakt".
- **Bündelung:** Mehrere Änderungen innerhalb von 5 Minuten werden zu einer Nachricht zusammengefasst, damit es nicht spammt.
- **Nur bei geteilten Listen** mit mindestens 2 Mitgliedern; eigene Änderungen lösen keine Nachricht aus.

## 2. Einkauf gestartet / abgeschlossen

- **Auslöser:** Ein Listenmitglied tippt auf „Einkauf starten" (neuer Button in der Listenansicht) bzw. „Einkauf abschliessen".
- **Text:** „Anna ist einkaufen — jetzt noch fehlende Artikel zu „Wocheneinkauf" hinzufügen!" / „Einkauf abgeschlossen: 12 von 14 Artikeln erledigt".
- **Nutzen:** Der Klassiker — „ich stehe im Laden, brauchst du noch was?" — ohne Anruf.

## 3. Erinnerungen

- **Einstellung pro Liste:** Wochentag + Uhrzeit wählbar (z. B. Samstag 9:00), unter „Meine Listen" oder in der Listenansicht.
- **Text:** „Erinnerung: „Wocheneinkauf" hat 8 offene Artikel".
- Nur wenn die Liste offene Artikel hat; leere Listen erinnern nicht.

## 4. Vorrat & Verlauf

- **Vorrat:** Wenn ein Vorratsartikel die Mindestmenge unterschreitet — „Vorrat: Milch ist fast leer. Auf die Einkaufsliste setzen?" mit einem Button, der den Artikel direkt hinzufügt.
- **Verlauf:** Häufig gekaufte Artikel, deren typischer Rhythmus überschritten ist — „Du kaufst Brot meist alle 5 Tage — wieder nötig?"
- Beide erscheinen höchstens einmal pro Tag und Artikel, gebündelt in einer Nachricht.

## Einstellungen (unter „Mehr")

Neuer Bereich „Mitteilungen" mit einem Schalter pro Art:
- Listenänderungen (an/aus)
- Einkauf gestartet/erledigt (an/aus)
- Erinnerungen (an/aus)
- Vorrat & Verlauf (an/aus)

Standard: alle an. Zusätzlich globaler Schalter „Mitteilungen erlauben", der die Browser-Berechtigung anfragt.

## Technische Umsetzung (späterer Schritt)

- **Firebase Cloud Messaging** über den Lovable-Konnektor verbinden (einmalig: Firebase-Projekt mit Web-Push verknüpfen).
- **Geräte-Registrierung:** Beim Aktivieren fragt die App die Browser-Berechtigung an und speichert das Geräte-Token in einer neuen Tabelle `push_tokens` (pro Nutzer, mehrere Geräte möglich). Hinweis: In der eingebetteten Vorschau blockieren Browser die Berechtigung — die App muss dafür in einem eigenen Tab geöffnet sein.
- **Versand:** Server-Funktionen senden über die Firebase-Schnittstelle; ungültige Tokens werden automatisch gelöscht.
- **Erinnerungen & Vorrat:** Zeitgesteuerte Prüfung (Cron) prüft fällige Erinnerungen und niedrige Vorräte und stösst den Versand an.
- **Listenänderungen & Einkauf:** Werden direkt beim Speichern der Änderung ausgelöst (an alle Listenmitglieder ausser den Auslöser).
- **Sprache:** Nachrichten erscheinen in der Sprache des Empfängers (gespeicherte App-Sprache pro Nutzer).
- **Einschränkung:** Push funktioniert nur für angemeldete Nutzer; lokale Gästelisten ohne Konto können keine Nachrichten empfangen.

## Nächster Schritt nach Freigabe

1. Firebase-Konnektor verbinden (einmalige Einrichtung durch dich).
2. Tabelle für Geräte-Tokens + Einstellungsbereich unter „Mehr".
3. Die vier Nachrichtenarten nacheinander umsetzen und testen.
