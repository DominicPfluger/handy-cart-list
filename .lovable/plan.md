# Ladenname neben „Ausgeblendet" in der Abteilungs-Reihenfolge

## Ziel
In den Einstellungen unter „Abteilungs-Reihenfolge" zeigt die Zwischenüberschrift „Ausgeblendet" zusätzlich den Namen des aktuell gewählten Ladens, z. B. „Ausgeblendet · Migros". So ist klar, für welches Geschäft die ausgeblendeten Abteilungen gelten, ohne nach oben zum Laden-Dropdown scrollen zu müssen.

## Änderung
- `src/components/store-order-settings.tsx`, Zeile ~105: Die Überschrift wird zu
  `{t("store.hiddenTitle")} · {selected.name}`.
- Der Ladenname folgt dem bestehenden Auswahl-Dropdown (Standard-Laden oder eigenes Geschäft) — keine neue Logik, keine i18n-Änderung nötig, da der Ladenname ein Datenwert ist.
- Alles andere (Liste, Einblenden-Knopf, Drag & Drop, Zurücksetzen) bleibt unverändert.

## Prüfung
- Typprüfung (`bunx tsgo --noEmit`) und Build.
- Browser-Test: Einstellungen → Abteilungs-Reihenfolge aufklappen, Laden wechseln, prüfen, dass „Ausgeblendet · <Ladenname>" den gewählten Laden anzeigt.
