# Geschätzten Gesamtpreis in Listen korrigieren

## Problem
Der Gesamtpreis rechnet jeden Artikel so, als gälte der gespeicherte Marktpreis für die Standardmenge des Produkts (z. B. „1 Glas"). Die gespeicherten Preise gelten aber für eine konkrete Packung (z. B. Senf: 2.40 für 200 g, Sojasauce: 2.90 für 150 ml). Weicht die Mengenangabe in der Liste davon ab, wird der Betrag falsch hochgerechnet oder fällt ganz weg.

## Lösung
Der Preis pro Artikel wird so gerechnet, in dieser Reihenfolge:
1. **Gleiche Einheit wie die Standardmenge** (z. B. 2 Gläser): Packungspreis × Anzahl.
2. **Gewicht/Volumen** (g, kg, ml, l …): Wenn eine Packungsgrösse oder ein Grundpreis (pro kg/l/100 g) bekannt ist, wird damit umgerechnet, z. B. 400 g Senf = 2 × 200 g = 4.80.
3. **Stück-artige Einheiten** (Stück, Packung, Flasche, Glas …): Sie gelten als 1 Packung, z. B. 3 Flaschen = 3 × Packungspreis.
4. Sonst zählt der Artikel als „ohne Preis" und wird nicht geschätzt.

Zusätzlich:
- Mengen ohne Leerzeichen wie „500g" oder „1,5kg" werden erkannt.
- Ausreisser werden abgefangen: Liegt ein einzelner Artikel über dem 50-fachen Packungspreis, zählt er als „ohne Preis".

## Technische Details
- `src/lib/item-price.ts`: `priceForItem` erhält die ganze Preiszeile (`price`, `pack_size`, `pack_unit`, `unit_price`, `unit_basis`); Einheiten wie „g", „Stück", „100g" werden auf die App-Einheiten abgebildet (UNIT_SCALE erweitert). Packungsgrösse ist die erste Wahl, die Standardmenge des Produkts nur der Fallback.
- Regex für Mengen ohne Leerzeichen.
- Anpassen der Aufrufe in `src/routes/index.tsx` (Gesamtpreis) und überall sonst, wo `priceForItem` genutzt wird (Preisvergleich).
- Prüfung mit Unit-Tests (vitest) für die Beispiele oben und im Browser mit einer Testliste.
