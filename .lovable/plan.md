# Kategorie-Filter in „Pflege → Produkte ohne Bild"

## Ziel
Im Admin-Panel „Pflege → Produkte ohne Bild" (MissingImagesPanel) kommt neben dem Suchfeld und dem Bild-Filter ein Kategorien-Dropdown dazu. Damit lässt sich die Liste auf eine Abteilung/Unterkategorie einschränken.

## Umsetzung (nur `src/components/admin/missing-images-panel.tsx` + i18n)

1. **Neuer State** `cat` (Department-ID oder `""` für „Alle Kategorien").
2. **Dropdown** neben dem bestehenden Filter-Select: erste Option „Alle Kategorien", danach alle Abteilungen aus `depts`, sortiert nach ihrem Pfad (`path()`-Ausgabe, z. B. „Frischmarkt › Früchte"), Label = voller Pfad.
3. **Filterlogik** in `missing`: Beim gewählten Dept das Produkt behalten, wenn `p.department_id` dem gewählten Dept entspricht ODER ein Nachfahre davon ist (Parent-Kette via `deptById`). Kombiniert mit bestehendem Bild-Filter und Suche; Änderung setzt `limit` auf PAGE (5) zurück.
4. **i18n**: Neuer Schlüssel `adm.noImg.cat` („Alle Kategorien") in `src/i18n/de.ts` und allen 15 weiteren Locales in `src/i18n/messages.json`.

## Verifikation
- Typprüfung + Build fehlerfrei.
- Browser-Test als Admin: Pflege → Produkte ohne Bild, Kategorie wählen → nur Produkte dieser (Unter-)Kategorie, Zähler im Titel aktualisiert, Suche/„Weitere 5 laden" funktionieren weiter.
