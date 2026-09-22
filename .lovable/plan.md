# Abteilungen — Produktkatalog mit Hierarchie, Favoriten und Mengendialog

Neue Ansicht, in der alle Produkte aus der Datenbank nach Supermarkt-Abteilungen und Kategorien gegliedert durchsucht und mit einem Klick auf die Einkaufsliste gesetzt werden können.

## Backend (Lovable Cloud)

Wird aktiviert, damit Kategorien, Produkte, Bilder und Favoriten echt gespeichert werden und der spätere Excel-Import direkt eingelesen werden kann.

Gespeichert wird:
- **Kategorien**: Name, Bild, Sortierung, Verweis auf die übergeordnete Kategorie (beliebig tief verschachtelbar)
- **Produkte**: Name, Bild, Standard-Masseinheit, Bio-Verfügbarkeit, zugehörige Kategorie
- **Favoriten**: pro Person markierte Produkte
- **Listeneinträge**: Produkt, Menge, Masseinheit, Bio ja/nein
- **Bilder**: eigener Speicherbereich für die Kategorie-Icons und Produktbilder, die du hochlädst

Zum Start werden Beispiel-Abteilungen und -Produkte angelegt (z. B. Frischeprodukte → Obst & Gemüse → Beeren → Erdbeeren), damit die Ansicht sofort funktioniert. Diese werden beim späteren Excel-Import ersetzt.

## Die neue Ansicht „Abteilungen"

- Neuer Tab in der unteren Navigation (Liste, Abteilungen, Favoriten, Rezepte, Mehr)
- Raster mit mittelgrossen Kategorie-Kacheln inkl. Vorschaubild
- Klick öffnet die nächste Ebene — beliebig tief; oben eine Brotkrumen-Navigation (z. B. Frischeprodukte › Obst & Gemüse › Beeren) mit Zurück-Möglichkeit
- Auf der untersten Ebene: Produktliste mit kleinem Bild, Name, einem Plus- und einem Herz-Symbol
- Suchfeld, das Produkte über alle Ebenen hinweg findet
- Platzhalter-Bild, solange kein Icon hochgeladen wurde

## Mengen-Dialog

Klick auf das Plus öffnet ein Dialogfeld:
- Menge (Zahl) und Auswahl der Masseinheit
- Checkbox „Bio-Produkt"
- Bestätigen legt den Eintrag auf der aktuell gewählten Einkaufsliste ab

Masseinheiten: Stück, Gramm, Kilogramm, Milligramm, Pfund, Unzen, Milliliter, Deziliter, Liter, Gallone, Tasse, Glas, Flasche, Dose, Beutel, Packung, Schachtel, Box, Karton, Kiste, Kanister, Bündel.

Bio-Artikel erscheinen in Liste und Warenkorb mit dem Zusatz „(Bio)", z. B. „Erdbeeren (Bio)".

## Favoriten

- Eigener Tab mit allen per Herz markierten Produkten
- Herz ist in Abteilungen und Favoriten gleichermassen an-/abwählbar
- Aus den Favoriten lässt sich ein Produkt über dasselbe Mengen-Dialogfeld direkt auf die Liste setzen

## Bestehende Einkaufsliste

Die Liste zeigt weiterhin die gewohnte Darstellung, ergänzt um Produktbild, Masseinheit und den Bio-Zusatz. Manuell getippte Artikel funktionieren unverändert.

## Technische Details

- Tabellen `departments` (self-referencing `parent_id`, `sort_order`, `image_path`), `products`, `favorites`, `list_items`; Storage-Bucket `catalog-images`
- Katalog öffentlich lesbar (`TO anon` SELECT), Favoriten/Listeneinträge nutzerbezogen per RLS auf `auth.uid()`; alle Tabellen mit expliziten GRANTs
- Lesen des Katalogs über eine öffentliche Server-Funktion (rekursives CTE für den Pfad), Schreiben über `requireSupabaseAuth`
- Neue Routen `src/routes/abteilungen.tsx` (+ `$path` Splat für Tiefe) und `src/routes/favoriten.tsx`, eigene `head()`-Metadaten
- Mengen-Dialog als shadcn `Dialog`; Masseinheiten als Enum im Schema

## Offen

Sobald du die Excel-Datei mit Kategorien, Produkten und Hierarchieebenen hochlädst, importiere ich die echten Daten. Die Kategorie- und Produktbilder kannst du danach hochladen.
