# Schnell-Dialog „Variante hinzufügen" in der Admin-Produktliste

## Ziel
Im Admin-Panel (Katalog) bekommt jede Produktzeile einen neuen Knopf, der einen kleinen Dialog öffnet, um dem Produkt schnell eine oder mehrere Varianten hinzuzufügen — ohne den grossen Bearbeiten-Dialog öffnen zu müssen.

## Umsetzung

### 1. Neuer Knopf pro Produktzeile (`src/components/admin/catalog-tile-editor.tsx`)
- Neben Stift und Papierkorb kommt ein weiterer Icon-Knopf (z. B. „🏷" bzw. Tags-Icon aus lucide-react), Titel/aria-label = „Variante hinzufügen".
- Nur aktiv im Bearbeiten-Modus (wie Stift/Papierkorb); bei Alias-Zeilen wirkt er auf das Stammprodukt.

### 2. Neuer Dialog „Varianten hinzufügen"
- Zeigt Produktname und die bereits vorhandenen Varianten (nur zur Info, nicht editierbar).
- Mehrzeiliges Eingabefeld: eine Variante pro Zeile (leere Zeilen und Dubletten — auch Gross-/Kleinschreibung — werden ignoriert).
- Knöpfe: „Abbrechen" und „Hinzufügen".

### 3. Speichern
- Die neuen Varianten werden an das bestehende `variants`-Array des Produkts angehängt (Reihenfolge bleibt), per `supabase.from("products").update({ variants })`.
- Danach wird die Produktliste neu geladen, damit die Zeile sofort aktuell ist.
- Wie im Bearbeiten-Dialog wird anschliessend die bestehende Übersetzungs-Funktion `translateVariants` aufgerufen, damit die neuen Varianten in allen Sprachen verfügbar sind (läuft im Hintergrund, kein manueller Eingriff nötig).

### 4. Übersetzungen
- Neue Texte (Knopf-Titel, Dialog-Titel, Hinweis, Bestätigung) in `src/i18n/de.ts` und allen 15 weiteren Sprachen in `src/i18n/messages.json`.

## Technische Details
- Datei: `src/components/admin/catalog-tile-editor.tsx` (Knopf + Dialog + Speicherlogik).
- Server-Funktion: vorhandenes `translateVariants` aus `src/lib/admin.functions.ts` (wird bereits im Admin-Bearbeiten-Dialog so genutzt, admin.tsx:660).
- Keine Datenbank-Änderung nötig (`products.variants` existiert).
- Keine automatischen KI-Bilder — der Dialog legt nur die Variante an; Bilder können wie bisher über den Bearbeiten-Dialog ergänzt werden.

## Prüfung
- Typprüfung (tsgo) und Build.
- Browser-Test: Dialog öffnen, zwei Varianten eintragen, speichern, prüfen dass sie in der Datenbank und im Bearbeiten-Dialog erscheinen; Testdaten danach wieder entfernen.
