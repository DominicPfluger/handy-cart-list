# Favoritenansicht: Produkt-Icons verwenden

## Befund
Die Favoritenansicht zeigt bei jedem Produkt nur das Symbol/Emoji, nie das kleine Produktbild (Icon). Grund: In `src/routes/favoriten.tsx` (ProductThumb, Zeile 70) wird dem Icon-Baustein nur die signierte Bild-Adresse (`iconUrl`) übergeben, nicht aber der zugehörige Bild-Pfad (`iconPath`). Der Baustein (`ProductIcon` in `src/components/catalog-icon.tsx`) rendert ein Bild aber nur, wenn der Pfad mitkommt — anders als in der Abteilungsansicht, die beide Werte weitergibt und deshalb Icons korrekt zeigt.

## Umsetzung
1. `src/routes/favoriten.tsx` — ProductThumb ergänzen:
   - `<ProductIcon emoji={product.emoji} iconUrl={product.iconUrl} iconPath={product.iconPath} symbolClassName="text-3xl" />`
   - Damit erscheint dasselbe kleine Icon wie in der Abteilungsansicht (respektiert die gerätelokale Einstellung Bilder/Symbole).
2. Keine Daten- oder Admin-Änderungen nötig; Favoriten ohne Katalog-Produkt (ohne Icon) zeigen weiterhin das Emoji als Fallback.

## Prüfung
- Playwright: Favorit mit Icon öffnen — Icon-Bild sichtbar (Handy 390px und Desktop), Einstellung „Symbole" zeigt weiterhin Emoji.
- Build fehlerfrei.
