# Suche in der Abteilungsansicht reparieren

## Ziel
Die Suche findet alle passenden Produkte aus dem Katalog, und Treffer erscheinen in der Reihenfolge, in der sie in der Abteilungsstruktur stehen (oberste zuerst).

## Ursachen (im Code gefunden)
1. **Kurze Suchbegriffe (bis 4 Buchstaben)** finden nur Produkte, deren Name mit dem Begriff *beginnt*. "Reis" findet z. B. "Basmatireis" nicht.
2. **Nur der übersetzte Name** wird durchsucht, nicht der deutsche Grundname — in anderen Sprachen fehlen dadurch Treffer.
3. **Ernährungs-/Küchenfilter und ausgeblendete Produkte** entfernen Produkte auch aus den Suchergebnissen, ohne Hinweis.
4. **Sortierung**: Treffer werden zuerst nach "Name passt direkt" sortiert, danach nach einer flachen Produktliste – nicht nach der Position in der Abteilungsstruktur.

## Änderungen
- Suche passt ab dem 1. Buchstaben auf **Wortanfänge innerhalb des Namens** und ab 3 Buchstaben auf **beliebige Teile** des Namens (z. B. "reis" findet "Basmatireis"); ß/ss und Akzente werden gleich behandelt.
- Zusätzlich durchsucht: deutscher Grundname, Varianten, Marken, Synonyme (wie bisher).
- Suche ignoriert Ernährungs- und Küchenfilter (Filter gelten weiter beim Stöbern). Selbst ausgeblendete Produkte bleiben ausgeblendet.
- **Neue Sortierung**: nach Position in der Abteilungsstruktur — Hauptabteilung in Kachel-Reihenfolge, darin Unterkategorien der Reihe nach, darin die Produkt-Reihenfolge. Kein Vorziehen mehr nach "Name passt direkt".
- Kein Trefferlimit.

## Prüfung
Im Browser: "reis", "milch", "tesa" suchen; Treffer vollständig und in Abteilungsreihenfolge; mit aktivem Ernährungsfilter erneut prüfen.

## Technische Details
- `src/lib/catalog-query.ts`: `matchesProductSearch` erweitern (normalisieren via NFD + ß→ss, Wortanfang / Teilstring ab 3 Zeichen), Grundname (`baseName`) mit prüfen.
- `src/routes/abteilungen.tsx`: `searchResults` aus `orderedProducts` minus `hiddenProductIds`/`removedIds` (ohne Diät/Küche); Rang = Tiefensuche über Abteilungsbaum (sortOrder) → Index je Abteilung, dann Produkt-sortOrder.
