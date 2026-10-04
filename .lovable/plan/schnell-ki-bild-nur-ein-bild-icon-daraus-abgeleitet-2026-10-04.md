# Schnell-KI-Bild: nur ein Bild, Icon daraus abgeleitet

## Ist-Zustand (geprüft)
Der Blitz-Knopf in „Bilder → Produkte ohne Bild" erzeugt bereits **nur ein** KI-Bild (1 Credit): `fix(p, false)` in `missing-images-panel.tsx` generiert das grosse Bild und leitet das kleine Icon daraus lokal im Browser ab (`saveProductIconFromPath`) — ohne zweite KI-Anfrage. Zwei getrennte KI-Bilder entstehen nur bei der ausdrücklich gewählten Option „zwei unterschiedliche Bilder" im Optionen-Dialog.

## Änderung
- Beschriftung des Blitz-Knopfs (Tooltip/Titel) klargestellt: „Schnellbild: 1 KI-Bild, Icon wird daraus abgeleitet (1 Credit)" — damit sichtbar ist, dass keine zwei Bilder erzeugt werden.
- Gleiche Klarstellung im Stapelmodus-Knopf „Alle mit KI erzeugen", solange die Ein-Bild-Option gewählt ist.
- Keine sonstige Logik-Änderung; die Zwei-Bilder-Option im Optionen-Dialog bleibt bestehen.

## Technik
- `src/components/admin/missing-images-panel.tsx`: Tooltip-Texte anpassen.
- i18n: Schlüssel `adm.noImg.quick` (und Stapel-Text) in `src/i18n/de.ts` + `messages.json` für alle 16 Sprachen aktualisieren.
- Prüfung: `bunx tsgo --noEmit`, Build-Log, kurzer Browser-Check der Tooltips.
