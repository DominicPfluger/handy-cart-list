# Rezepte-Admin: Bearbeiten/Löschen als Icons neben dem Zieh-Griff

## Aktuell
In `src/components/recipe-admin.tsx` haben Vorlagen-Zeilen („Vorlagen verwalten", Zeilen ~300–308) und Oberkategorien-Zeilen (Schritte, Zeilen ~361–372) die Buttons „Bearbeiten" und „Löschen" als Text ganz rechts in der Zeile.

## Umsetzung
- `Pencil` und `Trash2` aus `lucide-react` importieren (neu, bisher keine lucide-Imports in der Datei).
- **Vorlagen-Zeilen:** Die beiden Text-Buttons „Bearbeiten"/„Löschen" (rechts) durch je einen kompakten Icon-Button ersetzen — und diese Icon-Buttons **direkt neben den Zieh-Griff „⠿"** platzieren (vor dem Namen):
  - Stift-Icon = Bearbeiten (öffnet wie bisher `setTplForm({ id, emoji })`)
  - Papierkorb-Icon = Löschen (wie bisher `removeTpl(t)` mit Bestätigungsfrage)
- **Oberkategorien-Zeilen (Schritte):** Dasselbe Muster — Stift und Papierkorb direkt neben „⠿" (innerhalb des linken flex-Containers, vor dem Namen); die bisherigen Text-Buttons rechts entfallen.
  - Stift = `setStepForm({...})` wie bisher
  - Papierkorb = `removeStep(s)` wie bisher
- Buttons bleiben `disabled={busy}`, Größe kompakt (z. B. 14–16 px Icons, ghost-Stil, `text-muted-foreground`, hover wie vorhandene Icon-Buttons im Admin).
- `title`/`aria-label` weiterhin über vorhandene i18n-Schlüssel `adm.edit` / `adm.delete` (und `adm.drag` am Griff) — keine neuen Übersetzungen nötig.
- Aktiv/Deaktiviert-Umschalter bei Vorlagen bleibt rechts in der Zeile, unverändert.

## Verifikation
- Typprüfung, Build-Log prüfen, Browser-Test im Rezepte-Tab: Stift öffnet das Bearbeiten-Formular, Papierkorb löscht mit Bestätigung, Drag & Drop weiter funktionsfähig.
