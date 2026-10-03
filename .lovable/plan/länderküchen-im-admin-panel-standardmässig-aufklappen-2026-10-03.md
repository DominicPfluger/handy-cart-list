# Länderküchen im Admin-Panel standardmässig aufklappen

## Ziel
Der Bereich „Länderküchen“ im Admin-Panel (eigener Tab) ist beim Öffnen zugeklappt. Er soll standardmässig aufgeklappt sein — die Länderküchen sind sofort sichtbar.

## Umsetzung
- `src/components/cuisine-admin.tsx`, Zeile 84: `const [open, setOpen] = useState(false);` → `useState(true);`
- Sonst nichts: Zuklappen per Klick auf die Kopfzeile funktioniert weiterhin, Zähler und ▲/▼-Pfeil bleiben unverändert.

## Prüfung
- Typprüfung und Build.
- Browser-Test: Admin-Panel → Tab „Länderküchen“ — Bereich ist offen sichtbar; Zuklappen und wieder Aufklappen klappt.
- roadmap.md ergänzen.
