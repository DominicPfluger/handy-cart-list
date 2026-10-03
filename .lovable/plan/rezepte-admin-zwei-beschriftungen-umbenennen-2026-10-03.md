# Rezepte-Admin: zwei Beschriftungen umbenennen

## Ziel
Im Admin-Bereich „Rezepte" (Rezepte-Verwaltung) zwei Texte ändern:

1. Der aufklappbare Bereich „Vorlagen & Oberkategorien" heisst neu **„Vorlagen"**.
2. Der Button „Neue Oberkategorie" heisst neu **„Neue Vorlage"**.

## Umsetzung
- Die beiden Texte stehen in den Übersetzungsschlüsseln `adm.tplManage` und `adm.stepNew`, verwendet in `src/components/recipe-admin.tsx`.
- Deutsche Texte in `src/i18n/de.ts` ändern:
  - `adm.tplManage`: „Vorlagen & Oberkategorien" → „Vorlagen"
  - `adm.stepNew`: „Neue Oberkategorie" → „Neue Vorlage"
- Dieselben Schlüssel in `src/i18n/messages.json` für alle 15 weiteren Sprachen anpassen (z. B. Englisch: „Templates" / „New template", Französisch: „Modèles" / „Nouveau modèle" usw.).
- Keine Code-Logik ändern — nur Texte.

## Technische Details
- Dateien: `src/i18n/de.ts`, `src/i18n/messages.json` (16 Locale-Blöcke).
- Keine Migration, keine neuen Schlüssel — bestehende Schlüssel erhalten neue Werte.
- Danach Typprüfung und kurzer Browser-Check im Admin-Tab „Rezepte".
