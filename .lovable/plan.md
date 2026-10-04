# Vorlese-Texte als echter Admin-Tab

## Ziel
Die Vorlese-Texte werden wie alle anderen Bereiche direkt als Tab im Admin-Panel bearbeitet — ohne Sprung auf eine separate Seite.

## Ist-Zustand
- Die Bearbeitung liegt auf einer eigenen Seite `/vorlese-texte` (`src/routes/_authenticated/vorlese-texte.tsx`).
- Im Admin-Panel ist „Vorlese-Texte" nur ein Link-Tab (`admin.tsx` Zeile 738), der auf diese Seite führt.
- Die Breiten-Ausnahme für `/vorlese-texte` in `src/routes/__root.tsx` (Zeile 177) wird dann nicht mehr gebraucht.

## Umsetzung
1. **Neue Komponente** `src/components/admin/speech-texts-panel.tsx`: Der gesamte Bearbeitungs-Inhalt (Sprach-Auswahl, vier Textfelder, Platzhalter-Hinweis, Vorschau, Speichern) wird aus der Route in eine wiederverwendbare Komponente `SpeechTextsPanel` verschoben — unveränderte Logik (speech_texts-Tabelle, useSpeechTexts, speakSentences-Vorschau). Der „← Admin-Panel"-Rücklink und die Seitenüberschrift entfallen, da der Tab-Kontext das übernimmt.
2. **Admin-Tab** (`src/routes/_authenticated/admin.tsx`):
   - Tab-Liste um `["speech", "stx.title"]` ergänzen (mit 🔊-Icon wie bisher).
   - Den Link-Tab (Zeile 738–741) entfernen.
   - Neuen Abschnitt `{tab === "speech" && <SpeechTextsPanel />}` rendern.
3. **Aufräumen**:
   - Route `src/routes/_authenticated/vorlese-texte.tsx` löschen (kein Verweis mehr darauf).
   - In `src/routes/__root.tsx` die Breiten-Ausnahme `p.startsWith("/vorlese-texte")` entfernen (Admin-Breite gilt bereits für `/admin`).

## Technische Details
- Keine Datenbank- oder Server-Änderung; `speech_texts`-Tabelle und RLS bleiben unberührt.
- Keine neuen i18n-Schlüssel nötig (`stx.*` existiert bereits).
- Formularfelder behalten ihre begrenzte Spaltenbreite (`max-w-xl`), der Tab nutzt die volle Admin-Breite — wie zuletzt festgelegt.

## Verifikation
- Typprüfung und Build fehlerfrei.
- Browser-Test als Admin: Tab „Vorlese-Texte" öffnet die Bearbeitung direkt im Admin-Panel; Sprache wechseln, Text speichern und Vorschau abspielen funktionieren wie bisher.
