# Schnell-Erzeugen-Button „Produkte ohne Bild"

## Ziel
Im Admin unter „Pflege → Produkte ohne Bild" gibt es neben dem bestehenden Zauberstab (öffnet den KI-Bildoptionen-Dialog) zusätzlich ein Icon fürs sofortige Erzeugen: **ein** KI-Bild ohne Dialog, das für **beide** Bildarten gilt (grosses Vorschaubild + kleines Produkt-Icon, das daraus abgeleitet wird, 1 Credit).

## Umsetzung
Nur `src/components/admin/missing-images-panel.tsx`:

- Neuer Icon-Button pro Produktzeile (z. B. `Zap`-Icon), links neben dem bestehenden Zauberstab-Button.
- Klick ruft direkt die bestehende Funktion `fix(p, false)` auf — ohne Dialog, mit Standard-Bildoptionen. Das erzeugt das grosse Bild per KI und leitet das kleine Icon daraus ab (genau das gewünschte Verhalten „ein Bild für beide").
- disabled während der Lauf (`busy.has(p.id) || !!batch`), Spinner während der Ausführung wie beim Zauberstab.
- aria-label + title mit neuem i18n-Schlüssel `adm.noImg.quick` („Bild schnell erzeugen (1 Credit)").

## i18n
`adm.noImg.quick` in `src/i18n/de.ts` und allen 15 Locales in `messages.json` (de-AT/de-CH fallen automatisch auf Deutsch zurück).

## Kein Eingriff
Keine Server-/Datenbank-Änderung — `fix` mit `both=false` existiert bereits und macht genau dies.

## Verifikation
- Typprüfung + Build fehlerfrei.
- Browser-Test als Admin: Schnell-Button sichtbar, Klick erzeugt Bild + Icon ohne Dialog, Thumb-Update sichtbar.
