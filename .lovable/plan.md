# Jedem Laden ein Icon hinzufügen

## Ausgangslage

- Verwaltete Läden (Datenbank, im Admin unter „Märkte & Läden") haben bereits eine Emoji-Spalte — sie lässt sich im Admin aber weder beim Anlegen noch beim Bearbeiten setzen.
- Eigene (geräte-lokale) Läden („+ Neuer Laden" beim Listenerstellen, „Eigener Laden" in den Einstellungen) haben gar kein Icon.
- „Standard" hat kein Icon.

## Umsetzung

### 1. Datenhaltung
- `CustomStore` in `src/hooks/use-group-order.ts` erhält ein optionales `emoji`.
  `addCustomStore(name, emoji?)` erweitern; neue Funktion `updateCustomStore(id, { name?, emoji? })` (bestehende eigene Läden bleiben erhalten, nur das Icon/d der Name ändert sich).
- `useStores()` (`src/hooks/use-stores.ts`) liefert künftig `{ id, name, emoji }` mit **getrenntem** Name und Emoji (aktuell wird das Emoji in den Namen eingebettet). „Standard" erhält das feste Icon 🏪. Für verwaltete Läden kommt das Emoji aus der Datenbank.

### 2. Icon auswählen
- **Beim Anlegen eines eigenen Ladens** (Listenverwaltungs-Popup „+ Neuer Laden" in `list-manager.tsx` und Einstellungen → Abteilungs-Reihenfolge in `store-order-settings.tsx`): neben dem Namen ein kleines Emoji-Feld mit Vorschlägen (z. B. 🏪 🛒 🧺 🏬 🥖 🐄 🌱) und freier Eingabe.
- **Bestehende eigene Läden bearbeiten:** in den Einstellungen (Abteilungs-Reihenfolge) ein Stift-Symbol neben „Entfernen" — Dialog zum Umbenennen und Ändern des Icons.
- **Admin (Märkte & Läden, `markets-manager.tsx`):** Emoji-Feld beim Anlegen eines Ladens; Klick auf den Ladennamen erlaubt weiterhin Umbenennen, zusätzlich ein eigenes Stift-Feld nur für das Emoji.

### 3. Anzeige des Icons
Überall, wo Laden­namen erscheinen, steht künftig das Icon vor dem Namen:
- **Listen-Detailansicht** (`index.tsx`): statt des festen 🏪 das Icon des zugeordneten Ladens, danach der Name (ohne doppelt angezeigtes Emoji).
- **Einstellungen → Abteilungs-Reihenfolge:** Laden-Dropdown und Überschrift „Ausgeblendet · Ladenname".
- **Listenverwaltungs-Popup:** Laden-Dropdown beim Erstellen.
- Dropdown-Optionen bekommen das Emoji als Textpräfix; im Listen-Kopf wird es als eigenes Element gerendert.

### 4. Übersetzungen
Neue i18n-Schlüssel in `src/i18n/de.ts` (+ alle weiteren Sprachen proaktiv): „Icon", „Icon ändern", Hinweis beim Anlegen.

## Technische Details
- Eigene Läden bleiben geräte-lokal (`shoppi:custom-stores`); keine Schema-Änderung an der Datenbank nötig, `supermarkets.emoji` existiert bereits.
- Konsumenten von `useStores()` anpassen: `list-manager.tsx`, `store-order-settings.tsx`, `index.tsx` (Prüfung auf alle Vorkommen von `s.name`).
- Nach dem Umbau: Typprüfung `bunx tsgo --noEmit`, Browser-Test (eigenen Laden mit Icon anlegen, in Liste/Einstellungen prüfen, ohne Testdaten im Konto zu lassen).
