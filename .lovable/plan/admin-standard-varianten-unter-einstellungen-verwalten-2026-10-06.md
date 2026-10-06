# Admin: Standard-Varianten unter „Einstellungen" verwalten

## Ziel
Die Vorschlags-Chips (Bio, Vollkorn, vegan, laktosefrei, …) im Produkt-Bearbeiten-Dialog sind heute fest im Code. Neu werden sie unter Admin → Einstellungen in einem fünften Unterbereich „Standard-Varianten" gepflegt: hinzufügen, inline umbenennen, per Drag & Drop sortieren, löschen.

## Darstellung
- Liste untereinander, pro Zeile: Griff ⠿ (Ziehen), Name, ✎ (inline umbenennen, Enter/✓ speichert, Esc/✕ bricht ab), Papierkorb (mit Bestätigung).
- Oben Eingabefeld + „Hinzufügen" (Dubletten ohne Gross/Klein werden abgelehnt).
- Alle Knöpfe mit Rahmen (outline).
- Änderungen wirken sofort; bereits bei Produkten gespeicherte Varianten bleiben unverändert (nur die Vorschlagsliste ändert sich).

## Technische Details
- Neue Tabelle `standard_variants` (id, name, sort_order, Zeitstempel); alle lesen, nur Admins schreiben (`has_role`). Vorbefüllt mit den 11 heutigen Einträgen.
- Neue Komponente `src/components/admin/standard-variants-panel.tsx`, lazy im Einstellungen-Tab (`setTab2 = "variants"`).
- `admin.tsx` und `catalog-tile-editor.tsx`: festes `COMMON_VARIANTS` durch gemeinsamen Hook `useStandardVariants()` ersetzen (Fallback auf die bisherige Liste).
- Neue UI-Texte in `de.ts` + allen 16 Locale-Dateien.

## Prüfung
Typprüfung, Build, Browser-Test: hinzufügen, umbenennen, sortieren, löschen, Chips im Produkt-Dialog aktualisiert.
