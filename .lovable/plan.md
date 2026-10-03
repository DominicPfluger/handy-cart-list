# Produkt-Varianten im Rezept-Generator

## Ziel
Wenn eine gewählte Zutat Varianten hat (z. B. Mehl: Vollkorn, Dinkel), erscheint nach dem Antippen direkt darunter eine kleine Variantenauswahl. Die gewählte Variante wird im Rezept gespeichert und auf die Einkaufsliste übernommen.

## Verhalten
- Nur Zutaten mit Varianten zeigen die Auswahl; ohne Auswahl bleibt das Grundprodukt.
- Pro Zutat eine Variante (oder keine) — kleine Chips „Standard · Vollkorn · Dinkel …“ in der Landessprache.
- Der gewählte Zutat-Chip und die Zusammenfassung oben im Bereich zeigen „Mehl · Vollkorn“.
- Abwählen der Zutat setzt die Variante zurück; „Überraschen“ wählt keine Variante.
- Einkaufsliste: Eintrag „Mehl · Vollkorn“, gleich wie beim normalen Produkt-Dialog.
- Gespeicherte/geteilte Rezepte: Variante erscheint im Zutatennamen und bleibt beim erneuten Öffnen ausgewählt; die Rezeptseite übernimmt sie auf die Einkaufsliste.

## Technische Details
- `recipe-builder.tsx`: neuer State `variants: Record<productId, string>`; Chips unter dem Produkt mit `pickName(product.variantNames[v], locale, v)`; Name im Item = `${name} · ${variantName}`; neues optionales Feld `variant` in `RecipeItem` (recipes-api.ts, items-JSON — keine DB-Änderung).
- Beim Laden eines Rezepts `item.variant` wieder in den State übernehmen; Reset bei Vorlagenwechsel.
- `rezept.$slug.tsx`: gespeicherten Namen inkl. Variante an `addCatalogItem` übergeben.
- Neue Texte (z. B. „Standard“) in de.ts + allen 15 Sprachen.
- Prüfung: Typcheck, Build, Browser-Test (Pizza → Zutat mit Varianten wählen → auf Einkaufsliste übernehmen).
