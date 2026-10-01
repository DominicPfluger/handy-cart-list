# Vorlesen der Einkaufsliste

## Was du bekommst
- Ein neuer Lautsprecher-Button neben dem Teilen-Button beim Listentitel.
- Antippen liest die aktive Liste vor: zuerst Listenname und Anzahl offener Artikel, dann jeden offenen Artikel mit Menge und Einheit (z. B. „2 Liter Frischmilch“), gruppiert nach Abteilung („Milchprodukte: …“).
- Bereits abgehakte Artikel werden übersprungen.
- Während des Vorlesens wird der Button zu „Stopp“; erneutes Antippen beendet die Ausgabe.
- Gelesen wird in der eingestellten App-Sprache mit passender Stimme des Geräts (z. B. Schweizer Deutsch, falls vorhanden).
- Ist die Liste leer, sagt die App „Die Liste ist leer“. Unterstützt das Gerät keine Sprachausgabe, erscheint ein Hinweis.
- Der Button hat eine klare Beschriftung für Bildschirmleser (VoiceOver/TalkBack).

## Technische Details
- Neue Komponente `src/components/speak-list-button.tsx` mit der eingebauten Sprachausgabe des Browsers (Web Speech `speechSynthesis`), keine Kosten, kein Server.
- Text pro Abteilung als einzelne Sätze in eine Warteschlange, Stimme per `lang` = aktuelle Locale; Abbruch per `speechSynthesis.cancel()`, auch beim Verlassen der Seite.
- Eingebunden in `src/routes/index.tsx` neben dem Teilen-Button; Artikelnamen über die bestehende `displayName` / `relocalizeQuantity`.
- Neue Texte (`speak.read`, `speak.stop`, `speak.empty`, `speak.unsupported`, `speak.intro`) in `de.ts` und allen 15 Sprachen.
