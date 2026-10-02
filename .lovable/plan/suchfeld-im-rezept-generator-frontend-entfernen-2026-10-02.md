# Suchfeld im Rezept-Generator (Frontend) entfernen

## Ziel
Das Suchfeld über den Zutaten-Ebenen im Rezept-Generator verschwindet wieder. Das Suchfeld im Admin-Panel (Zutaten-Bereiche und „Aus Katalog") bleibt unverändert.

## Änderungen — `src/components/recipe-builder.tsx`

1. **Suchfeld entfernen:** Der Input-Block `s.products.length >= 8 && <input … stepSearch … />` wird gelöscht.
2. **Suchzustand entfernen:** State `stepSearch` (und dessen Reset-Effekt beim Vorlagenwechsel, falls vorhanden) wird gelöscht.
3. **Suchlogik entfernen:** In der Ebenen-Renderlogik wird `q` nicht mehr berechnet; `pool` ist immer `s.products`, `hasGroups` ist immer `s.groups.length > 0`, und die `|| !!q`-Bedingungen bei „Weitere anzeigen“/expanded entfallen. Die Kategorie-Aufklapplogik (Chips mit ▴/▾, mehrere gleichzeitig offen, gewählte Produkte immer sichtbar, PAGE = 10) bleibt exakt so, wie sie ist.

## i18n
Der Schlüssel `rk.stepSearch` bleibt in `de.ts` und allen 15 Lokalen erhalten (ungenutzte Schlüssel bleiben bewusst drin — gleiche Praxis wie bei `more.hiddenCategoriesHint`).

## Prüfung
- Typcheck + Build.
- Browser-Test im Generator (z. B. Pizza): kein Suchfeld mehr über den Ebenen, Kategorien klappen weiterhin auf, Auswahl und „Weitere anzeigen“ funktionieren, keine Page-Fehler (Desktop + 390 px).
