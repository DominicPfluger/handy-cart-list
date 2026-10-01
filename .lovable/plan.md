# Icons für alle Produkte ohne Listen-Icon

## Ausgangslage
Über 900 Produkte haben kein Icon (`products.emoji` ist leer) und erscheinen in der Listenansicht nur mit einem Punkt. Betroffen sind u. a. Fruchtsirupe (64), Fruchtkonserven (38), Getreide (37), Lamm (30), Fisch (29) und viele weitere Kategorien.

## Vorgehen
1. **KI-Vergabe pro Produkt:** Eine neue Server-Funktion (nach dem Muster der bestehenden Übersetzungs-/Vorschlagsfunktionen) schickt die Produktnamen ohne Icon in Paketen von ca. 100 an die KI und lässt je ein passendes Emoji vergeben (z. B. Lammkeule → 🍖, Apfelsaft → 🧃).
2. **Speichern:** Die Ergebnisse werden direkt in `products.emoji` geschrieben (nur leere Felder, vorhandene Icons bleiben unberührt).
3. **Aufruf:** Einmalig von mir ausgelöst (Admin-Server-Funktion mit Rechteprüfung), in mehreren Durchläufen bis alle Produkte ein Icon haben.
4. **Fallback:** Produkte, für die die KI nichts Sinnvolles liefert, erhalten das Icon ihrer Kategorie.

## Technische Details
- Neues `assignProductEmojis` in `src/lib/admin.functions.ts` (Admin-Prüfung wie bei `suggestProducts`), Batch-Update auf `products.emoji`.
- Keine Schemaänderung, keine Übersetzungen nötig (Emojis sind sprachneutral).
- Bestehende Icons (z. B. 💧 bei Wasser) werden nicht überschrieben.

## Prüfung
- Danach zähle ich verbleibende Produkte ohne Icon (Ziel: 0) und kontrolliere Stichproben in der Vorschau.

---

# Varianten übersetzen (neu)

## Ausgangslage
Noch nicht umgesetzt: Varianten (z. B. „Bio“, „Vollkorn“) werden nur auf Deutsch gespeichert und in allen Sprachen deutsch angezeigt.

## Vorgehen
1. Neue Tabelle für Varianten-Übersetzungen je Produkt, Variante und Sprachvariante (inkl. Schweizer Schreibweise ß→ss).
2. Beim Speichern eines Produkts im Admin-Panel werden neue Varianten automatisch über den bestehenden KI-Weg in alle 16 Sprachvarianten übersetzt.
3. Einmalige Nachübersetzung aller bereits vorhandenen Varianten.
4. Im Hinzufügen-Dialog erscheinen Varianten in der eingestellten Sprache; auf der Liste landet der übersetzte Begriff.

## Technische Details
- Tabelle `product_variant_translations(product_id, variant, locale, name, is_manual)`, Lesen öffentlich, Schreiben via RLS `has_role`/`is_market_product_admin`, GRANTs + updated_at-Trigger.
- Übersetzung in `updateProduct`-Pfad (`admin.functions.ts`) mit `translateNames`; Katalog-Abfrage liefert Übersetzungen mit, Anzeige über `pickName`-ähnliche Hilfsfunktion.
- Vorschlags-Chips im Editor bleiben deutsch (Quelltext), Anzeige für Nutzer übersetzt.
