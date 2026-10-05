# Läden per Drag & Drop sortieren

## Ziel
In den Einstellungen unter „Abteilungen ordnen & umbenennen" werden die Läden statt als Dropdown als Liste mit Verschiebe-Griffen angezeigt und lassen sich per Drag & Drop sortieren. Die Reihenfolge gilt geräte-lokal und überall, wo Läden zur Wahl stehen.

## Umsetzung

1. **Laden-Liste statt Dropdown** (`src/components/category-order-settings.tsx`)
   - Der `<select>` wird durch eine aufklappbare Laden-Liste ersetzt: jeder Laden eine Zeile mit Emoji, Name, Verschiebe-Griff (dnd-kit, gleiches Muster wie bei den Abteilungen).
   - Der aktuell gewählte Laden ist markiert (Häkchen); Tippen auf eine Zeile wählt den Laden.
   - „Alle Läden" (Standard) bleibt fix an erster Stelle und ist nicht verschiebbar.
   - Bearbeiten/Löschen eigener Läden und „+ Neuer Laden" bleiben wie bisher (Stift-/Papierkorb-Buttons pro eigener Zeile, Anlege-Formular darunter).

2. **Reihenfolge speichern** (`src/hooks/use-group-order.ts`)
   - Neuer geräte-lokaler Schlüssel `shoppi:store-order` (Array von Laden-IDs), neuer Hook-Zugang `storeOrder` / `saveStoreOrder`.
   - Sync über das bestehende `shoppi:list-group-order-changed`-Event, damit alle Ansichten sofort reagieren.

3. **Reihenfolge überall anwenden** (`src/hooks/use-stores.ts`)
   - `useStores()` sortiert die Läden des Marktes und die eigenen Läden gemäss `shoppi:store-order`; unbekannte/neue Läden hängen hinten an.
   - Dadurch gilt die Reihenfolge automatisch auch im Laden-Popup der Abteilungsansicht und im „Liste bearbeiten"-Dialog.

4. **Übersetzungen**
   - Neuer Schlüssel `store.orderHint` („Ziehen, um die Reihenfolge der Läden zu ändern") in `src/i18n/de.ts` und allen 15 Locale-JSONs.

## Technik
- dnd-kit ist bereits im Projekt (Abteilungs- und Vorlagen-Sortierung) — kein neues Paket.
- Keine Datenbank-Änderung; die Sortierung ist geräte-lokal wie die übrigen Laden-Einstellungen.

## Prüfung
- Typprüfung `bunx tsgo --noEmit`.
- Browser-Test: Einstellungen öffnen, Läden ziehen, Reihenfolge im Laden-Popup der Abteilungsansicht kontrollieren.
