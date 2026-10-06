# Varianten-Anzahl in der Kopfzeile des Admin-Katalogs

## Ziel
Im Admin-Bereich, Tab „Katalog", zeigt die Kennzahlen-Zeile am Seitenanfang zusätzlich die Gesamtzahl der Varianten im gesamten Katalog.

## Umsetzung

Datei: `src/routes/_authenticated/admin.tsx`

1. Die Kennzahlen-Zeile (Zeile ~887) erhält eine fünfte Kachel:
   - Label: vorhandener Übersetzungsschlüssel `adm.variants` („Varianten")
   - Wert: Summe der Varianten aller Produkte, z. B.
     `d.prods.reduce((s, x) => s + (x.variants?.length ?? 0), 0)`
   - Die Produkte inklusive Varianten-Feld (`d.prods`) sind bereits vollständig geladen — keine zusätzliche Datenbankabfrage nötig.
2. Grid der Zeile von `grid-cols-4` auf `grid-cols-5` erweitern, damit die fünf Kacheln (Kategorien, Produkte, Überschriften, Medien, Varianten) gleichmässig verteilt sind.

Es werden nur echte Produkte gezählt; Alias-Einträge liegen nicht in `prods` und fallen automatisch heraus.

## Betroffene Stellen
- `src/routes/_authenticated/admin.tsx` — Stat-Zeile im Tab „Katalog" (Grid + neue Kachel)
- Keine Datenbank- oder Logikänderung, keine neuen Übersetzungsschlüssel nötig (`adm.variants` existiert in allen 16 Sprachen).

## Verifikation
- Build prüfen (`build-errors.log`).
- Browser-Test: Admin-Katalog öffnen, Zeile zeigt „Varianten · N", N entspricht der Summe aller Varianten (Stichprobe gegen eine Kategorie mit bekannten Varianten).
