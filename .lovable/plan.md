# Produkt einer Überschrift zuordnen (Admin-Panel)

## Ziel
Im Produkt-Bearbeiten-Fenster (Admin → Katalog) kann man wählen, unter welcher Überschrift das Produkt in der Kategorie steht. Das Produkt wird dann ans Ende der gewählten Überschriften-Gruppe verschoben.

## Umsetzung

### 1. Auswahl im Bearbeiten-Fenster (`src/routes/_authenticated/admin.tsx`)
- Neuer Abschnitt „Überschrift" im Produkt-Dialog (zwischen Kategorie und Varianten).
- Dropdown mit:
  - „Keine Überschrift" (Produkt steht ganz oben, vor der ersten Überschrift)
  - allen Überschriften der aktuellen Kategorie (aus `product_headings`)
- Vorauswahl: die Überschrift, unter der das Produkt aktuell steht (ermittelt aus der Position des Produkts relativ zu den Überschriften-Ankern).

### 2. Verschiebe-Logik
- Beim Speichern (nur wenn die Auswahl geändert wurde):
  - **Überschrift gewählt:** Das Produkt wird ans Ende der Gruppe dieser Überschrift verschoben (direkt vor das Anker-Produkt der nächsten Überschrift bzw. ans Listenende).
  - **„Keine Überschrift":** Das Produkt wird an den Anfang der Kategorie verschoben (vor die erste Überschrift).
- Umsetzung über die bestehende `saveOrder`-Funktion (neue Reihenfolge der Produkte), wie beim Drag & Drop. Bei gewähltem Markt gilt die Verschiebung nur für diesen Markt (bestehendes Verhalten von `saveOrder`).
- Sonderfall: Ist das Produkt selbst der Anker einer Überschrift (eine Überschrift hängt direkt an ihm), wird diese Überschrift beim Verschieben auf das nächste Produkt umgehängt (bestehende `saveHeading`-Funktion), damit sie nicht ins Leere zeigt.

### 3. Übersetzungen
- Neuer Schlüssel `adm.headingAssign` („Überschrift") und `adm.noHeading` („Keine Überschrift") in `src/i18n/de.ts` und allen 15 Locales in `messages.json`.

## Nicht geändert
- Drag & Drop von Produkten und Überschriften bleibt wie es ist.
- Keine Datenbankänderung — die Zuordnung ergibt sich weiterhin aus der Reihenfolge (`sort_order`) und den Überschriften-Ankern (`product_headings.before_product_id`).

## Verifikation
- Build prüfen, dann in der Vorschau: Produkt öffnen, andere Überschrift wählen, speichern, prüfen dass das Produkt in der Kachelansicht unter der neuen Überschrift steht (auch nach Neuladen).
