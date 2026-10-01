# Vorlese-Texte auf Deutsch + Admin-Seite „Vorlese-Texte"

## Warum es Englisch klingt
Das Vorlesen folgt der eingestellten App-Sprache. In deiner Vorschau ist Englisch (en-US) aktiv, deshalb kommen Ansage und Stimme auf Englisch.

## 1. Eigene Vorlese-Sprache (Standard: Deutsch)
- Unter „Mehr", direkt bei „Vorlese-Geschwindigkeit", neue Auswahl **„Vorlese-Sprache"**.
- Standard: **Deutsch** – unabhängig von der App-Sprache. Wahlweise jede der 16 Sprachvarianten (z. B. Deutsch (Schweiz)).
- Ansagetexte, Kategorienamen und Produktnamen werden in der Vorlese-Sprache vorgelesen; es wird eine passende Gerätestimme gewählt (deutsche Stimme, sonst Gerätestandard mit Sprache „de").
- Gespeichert nur auf diesem Gerät.

## 2. Admin-Seite „Vorlese-Texte"
- Neue Seite im Admin-Panel (eigener Bereich/Link „🔊 Vorlese-Texte").
- Pro Sprache bearbeitbare Texte, die für **jede Einkaufsliste** gelten:
  - **Begrüssung** – z. B. „Einkaufsliste {name}. {count} Artikel offen."
  - **Leere Liste** – z. B. „{name}. Die Liste ist leer."
  - **Kategorie-Ansage** – z. B. „{kategorie}: {artikel}."
  - **Schluss** (optional) – z. B. „Ende der Liste."
- Platzhalter {name}, {count}, {kategorie}, {artikel} werden automatisch ersetzt; Hinweis zeigt die erlaubten Platzhalter.
- Knopf „▶ Probehören" liest einen Beispieltext mit der aktuellen Einstellung vor.
- „Auf Standard zurücksetzen" pro Text. Leere Felder fallen auf den eingebauten Standardtext zurück.
- Änderungen gelten sofort für alle Nutzer; nur Admins dürfen ändern.

## Technische Details
- Neue Tabelle `speech_texts` (locale, key, text, updated_at; unique(locale,key)); GRANT select an anon/authenticated, RLS: öffentlich lesbar, Schreiben nur `has_role(auth.uid(),'admin')`.
- Hook `use-speak-locale.ts` (localStorage `shoppi:speak-locale`, Standard `de-DE`).
- `SpeakListButton`: nutzt Vorlese-Locale statt App-Locale; Texte aus `speech_texts` (per React Query, Fallback auf i18n-Keys der Vorlese-Locale über `messages.json`); Kategorie-/Produktnamen werden mit `pickName` in der Vorlese-Locale aufgelöst (index.tsx übergibt dafür IDs bzw. die Gruppen werden im Button aufgebaut).
- Neue Route `src/routes/_authenticated/admin.vorlesen.tsx` + Link im Admin-Panel; i18n-Keys für die neuen Labels in de.ts + 15 Locales.
- Eintrag in AGENTS.md.
