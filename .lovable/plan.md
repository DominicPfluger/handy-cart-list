# Kategorienbild über der Produkteauflistung für jede Kategorie

## Ausgangslage
- In der Abteilungsansicht gibt es heute einen Bild-Banner über dem Kategorien-Inhalt (`src/routes/abteilungen.tsx`, Zeile ~568). Er erscheint aber nur, wenn die aktuelle Kategorie **beide** Bildpfade hat (`iconPath && imagePath`) — das erfüllen nur 2 von 306 Kategorien („Frühstücks-Cerealien" ist eine davon und zeigt den Banner bereits).
- 187 Kategorien haben ein grosses Bild (`image_path`), aber kein Icon (`icon_path` leer) — dort erscheint kein Bild.

## Änderung
1. **Banner-Bedingung lockern** (`src/routes/abteilungen.tsx`, Banner-Block):
   - Anzeige, wenn die aktuelle Kategorie ein Bild hat: `current?.imagePath || current?.iconPath` (statt beides zu verlangen).
   - Anzeige im Banner: grosses Bild bevorzugt (`imagePath`), sonst Icon (`iconPath ?? imagePath`); die bestehende `DepartmentIcon`-Komponente inkl. Geräte-Cache und Emoji-Fallback bleibt unverändert.
2. **Keine weiteren Änderungen**: Position (über Kategorien-Kacheln und Produktliste, wie bei „Frühstücks-Cerealien"), Grösse (h-36, abgerundet), Ausblendung bei aktiver Suche und das Symbol-/Bild-Einstellungsverhalten bleiben genau so.

## Betroffene Kategorien
- Neu mit Bildbanner: alle 189 Kategorien mit Bild (u. a. „Cerealien", „Backwaren & Frühstück" sowie fast alle Hauptabteilungen).
- Kategorien ohne jedes Bild (117) zeigen weiterhin keinen Banner (nur Emoji-Fallback wäre leer — dort bleibt es beim heutigen Zustand ohne Banner).

## Prüfung
- Browser-Test: Ansicht ohne und mit aktiver Suche; Kategorie mit nur Bild (Banner erscheint), „Frühstücks-Cerealien" (unverändert), Kategorie ohne Bild (kein Banner); Desktop und Mobil (390 px).
- Build fehlerfrei.
