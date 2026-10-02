# Katalog-Pflege im Admin-Panel

Neuer Bereich „Katalog-Pflege" im Admin-Panel (eigener aufklappbarer Abschnitt wie Märkte/Importe). Ziel: Dubletten und Datenlücken finden und direkt beheben. Alles läuft nur auf Knopfdruck — kein automatischer KI-Aufruf (Credits).

## Funktionen

### 1. Dubletten finden (Kernfunktion)
- Scan-Knopf prüft alle 3.622 Produkte lokal (kein KI-Aufruf, keine Credits):
  - **Gleiche Namen** (Schreibweise normalisiert: Gross/Klein, Akzente, ß/ss)
  - **Ähnliche Namen** (z. B. „Vollmilch" vs. „Vollmilch 3.5%", Wortüberlappung)
  - **Synonym-Konflikte** (Produkt heisst wie ein Synonym eines anderen, z. B. „Tesafilm" als Produkt, obwohl es Synonym von „Klebeband" ist)
- Ergebnisliste: Paare mit beiden Kategorien, je Paar Aktionen:
  - **Zusammenführen:** Ein Produkt bleibt, das andere wird als Synonym übernommen und gelöscht; Listen-Einträge und Übersetzungen bleiben erhalten
  - **Verknüpfen:** Zweites Produkt wird zum Alias (erscheint in beiden Kategorien, Daten nur einmal)
  - **Ignorieren:** Paar wird auf dem Gerät gemerkt und nicht mehr gezeigt

### 2. Datenlücken-Übersicht
Zähler-Kacheln, jeweils mit Liste und Direktlink zur Bearbeitung:
- Produkte ohne Bild
- Produkte ohne Emoji
- Produkte ohne Übersetzungen (pro Sprache fehlend)
- Produkte ohne Referenzpreis im aktuellen Markt
- Leere Kategorien (keine Produkte)
- Kategorien ohne Bild

### 3. Synonym-Verwaltung zentral
- Tabelle aller Synonyme (Produkt, Begriff, Sprache) mit Suche und Löschen
- Hinweis, wenn ein Synonym mit einem echten Produktnamen kollidiert

## Nicht enthalten (bewusst)
- Kein automatisches Zusammenführen ohne Bestätigung
- Keine KI-Dublettenerkennung im ersten Schritt (erst später, mit Bestätigung)

## Empfohlene Reihenfolge
1. Datenlücken-Übersicht (schnell, sofort nützlich)
2. Dubletten-Scan mit Zusammenführen/Verknüpfen
3. Synonym-Zentrale

## Technische Details
- Neues Panel `src/components/admin/catalog-health-panel.tsx`, eingebunden in `admin.tsx`
- Scan rein clientseitig über den bereits geladenen Katalog + `product_synonyms` (eine Abfrage)
- Zusammenführen: Server-Funktion `mergeProducts` (admin-geschützt): Synonyme/Übersetzungen/Aliase/Listeneinträge auf Zielprodukt umbiegen, Quelle löschen — in einer Transaktion
- Verknüpfen: bestehender `product_aliases`-Mechanismus
- Ignorierte Paare: localStorage
- Keine Schemaänderung nötig; neue UI-Texte in de.ts + 15 Sprachen
