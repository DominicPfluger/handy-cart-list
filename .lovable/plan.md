# Admin-Produktliste: Stift und Papierkorb neben dem Zieh-Griff

## Aktuell
Produktzeile im Admin-Katalog (`src/components/admin/catalog-tile-editor.tsx`, Zeilen 421–452):

```
[Checkbox] [⠿ Ziehen] [Bild] [Name/Info ………] [✏️ Stift] [🏷 Varianten] [✨ KI-Bild] [🗑 Papierkorb]
```

Stift und Papierkorb stehen am rechten Zeilenende — weit weg vom Bild und vom Zieh-Griff.

## Neu
Stift und Papierkorb wandern direkt neben den Zieh-Griff, links vor das Bild:

```
[Checkbox] [⠿ Ziehen] [✏️ Stift] [🗑 Papierkorb] [Bild] [Name/Info ………] [🏷 Varianten] [✨ KI-Bild]
```

## Änderungen (nur `src/components/admin/catalog-tile-editor.tsx`)
- Die beiden bestehenden `Button`-Blöcke (Pencil, Zeile 436–438; Trash2, Zeile 445–447) ausschneiden und direkt nach dem Zieh-Griff-`span` (Zeile 424), vor dem Bild-`span` (Zeile 425), wieder einfügen.
- Reihenfolge links: ⠿, dann Stift, dann Papierkorb.
- Varianten-Knopf (Tags) und KI-Bild-Knopf (Sparkles) bleiben rechts beim Namen.
- Funktionalität unverändert: gleiche onClick-Handler, `disabled={!editMode}`, Bestätigungsfrage beim Löschen, aria-label/title bleiben.

## Sonstiges
- Keine i18n-, DB- oder sonstigen Änderungen.
- Verify: Typprüfung, dann Browser-Test (Admin → Katalog → Abteilung mit Produkten: Icons links neben dem Bild, Drag & Drop, Stift-Dialog, Löschen-Confirm funktionieren).
