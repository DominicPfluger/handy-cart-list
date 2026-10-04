# Standard-Einheit direkt in der Abteilungsansicht ändern

## Ausgangslage

- Die Standard-Einheit eines Produkts lässt sich heute nur auf der Produktdetailseite ändern — dort über ein Dropdown, das nur Admins aktiv ist (`src/routes/produkt.$id.tsx`).
- In der Abteilungsansicht (`src/routes/abteilungen.tsx`) zeigt die Produktzeile die Einheit nur als Text an (z. B. „1 Stück").

## Umsetzung

1. **Einheiten-Auswahl in der Produktzeile (nur Admins):** In der Abteilungsansicht wird der Einheiten-Text in der Produktzeile für Admins zu einem kleinen Dropdown (gleiche Einheitenliste wie auf der Detailseite, `getUnits`). Beim Wechsel wird die neue Standard-Einheit sofort in der Datenbank gespeichert (`products.default_unit`) und der Katalog neu geladen — gleicher Speicherweg wie auf der Detailseite.
2. **Nicht-Admins:** sehen weiterhin nur den Text, ohne Dropdown.
3. **Menge bleibt:** Die Standard-Menge (Zahl) bleibt unverändert; nur die Einheit ist wählbar.
4. **Prüfung:** Im Browser als Admin eine Einheit in der Abteilungsansicht wechseln und kontrollieren, dass der neue Wert nach Neuladen bestehen bleibt; Typprüfung und Build laufen lassen.

## Technische Details

- Änderung in `src/routes/abteilungen.tsx`: Produktzeile bekommt für Admins ein `select` statt reinem Text für die Einheit; Speichern via `supabase.from("products").update({ default_unit })` + Katalog-Invalidierung, analog `produkt.$id.tsx`.
- Admin-Prüfung über den bestehenden `isAdmin`-Mechanismus.
- Keine Datenbank-Änderung nötig.
