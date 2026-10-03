# Schnell-Button für KI-Bild in der Admin-Produktliste

## Ziel
Jede Produktzeile im Admin-Katalog bekommt einen neuen Icon-Knopf (✨-Symbol), der direkt ein KI-Bild für das Produkt erzeugt — ohne den Bild-Dialog öffnen zu müssen.

## Verhalten
- Knopf liegt in der Produktzeile neben den bestehenden Icons (⠿ Ziehen, Stift, Variante, Papierkorb) — nur aktiv im Bearbeiten-Modus; bei Alias-Zeilen wirkt er auf das Stammprodukt.
- Klick → Bestätigungsfrage „KI-Bild für „Name" erzeugen? Dies verbraucht Credits." (wie bei den Varianten-Bildern). Erst nach „OK" wird das Bild erzeugt.
- Während der Erzeugung zeigt der Knopf einen Ladezustand; danach wird die Produktliste neu geladen, damit das neue Bild sofort sichtbar ist.
- Ein vorhandenes Bild wird dabei ersetzt (gleiche Wirkung wie „KI-Bild" im Bild-Dialog).

## Technische Umsetzung
- `src/components/admin/catalog-tile-editor.tsx`:
  - Neuer Icon-Button (Sparkles aus lucide-react) in der Produktzeile, `aria-label` = `tile.aiImage`, `disabled={!editMode}`.
  - Handler: `confirm(T("adm.variantImageAiConfirm", { name }))` → `useServerFn(generateImageFor)` mit `{ id: pid, kind: "product" }` aufrufen (Funktion existiert bereits, inkl. Admin-Prüfung und Stilregel „ohne Kräuter, Zusätze, Gefässe"), danach `p.run`-Reload auslösen; Fehler als Toast.
  - Lokaler Ladezustand pro Produkt (z. B. `aiBusy: string | null`).
- Das kleine Symbolbild (icon_path) wird wie bisher über die bestehende Icon-Komprimierung im Admin-Browser nachgezogen — kein neuer Mechanismus.
- Keine DB-Änderung, keine neue Server-Funktion, keine neuen i18n-Schlüssel (vorhandene Texte werden wiederverwendet).

## Prüfung
- Typprüfung und Build.
- Browser-Test: Knopf an einem Testprodukt klicken, Bestätigung erscheint, Bild wird erzeugt und in der Zeile sichtbar; danach Testprodukt-Bild zurücksetzen.
- roadmap.md ergänzen.
