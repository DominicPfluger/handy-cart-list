# Laden-Popup: Eintrag „Neuer Laden" unten ergänzen

## Ziel
Im Laden-Popup der Abteilungsansicht (Popup unter dem Laden-Symbol neben der Suchmaske) erscheint zuunterst ein Eintrag **„+ Neuer Laden"**. Tippen öffnet die Einstellungen und dort direkt den aufklappbaren Bereich **„Abteilungen ordnen & umbenennen"**, in dem eigene Läden angelegt, geordnet und umbenannt werden können.

## Änderungen

### 1. `src/components/store-picker-inline.tsx`
- Unterhalb der Läden-Liste einen abgesetzten Eintrag „+ Neuer Laden" (bestehender Text `store.new`) mit Plus-Styling ergänzen.
- Beim Tippen: Popup schliessen (neuer Prop `onClose`, in `abteilungen.tsx` → `setStoreOpen(false)`) und per `useNavigate` zu `/mehr?catOrder=1` navigieren.

### 2. `src/components/category-order-settings.tsx`
- Beim Mount `useEffect`: wenn der URL-Parameter `catOrder=1` gesetzt ist (`window.location.search`, nur im Browser geprüft), den Bereich automatisch aufklappen (`setOpen(true)`) und mit `scrollIntoView({ behavior: "smooth" })` zu dem Abschnitt scrollen (Ref auf den äusseren Wrapper).
- Optional den Parameter danach aus der URL entfernen (replaceState), damit ein Neuladen der Seite den Bereich nicht erneut aufklappt.

### 3. `src/routes/abteilungen.tsx`
- `StorePickerInline` den neuen Prop `onClose={() => setStoreOpen(false)}` übergeben.

## Sonstiges
- Keine neuen Übersetzungen nötig (`store.new` = „+ Neuer Laden" existiert in allen 16 Sprachen).
- Keine Datenbank-Änderungen.
- Verifikation: Typprüfung (`bunx tsgo --noEmit`), Browser-Check — Popup öffnen, „+ Neuer Laden" tippen → landet in den Einstellungen, Bereich „Abteilungen ordnen & umbenennen" ist aufgeklappt und im Sichtbereich; dort Laden anlegen funktioniert.
