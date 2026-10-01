# „Mit deinen Lieblingszutaten" wie „Beliebte Rezept-Kreationen" darstellen

## Ziel
Der Bereich „♥ Mit deinen Lieblingszutaten" zeigt heute nur Community-Rezepte, die zufällig deine Favoriten enthalten (oft leer). Neu zeigt er – genau wie „⭐ Beliebt" – fertige Zutaten-Kombinationen, die direkt im Rezept-Generator öffnen.

## So sieht es aus
- Gleiche Karte wie bei „Beliebt": farbiges Kategorie-Symbol links, darüber die Kategorie (z. B. „Smoothie"), als Titel die ersten 3 Zutaten, rechts „5 Zutaten".
- Tippen öffnet den Generator mit diesen Zutaten vorausgewählt.
- Pro Kategorie eine Kreation, die so viele deiner Favoriten wie möglich enthält; zuerst 5, darunter „Alle anzeigen".
- Ohne Favoriten erscheint der bisherige Hinweis („Markiere Produkte als Favorit …").
- Ernährungsform-Filter wird berücksichtigt.
- Auf der Inspirationen-Seite und im geöffneten Generator gleich.

## Wie die Kreationen entstehen
Für jede Rezept-Kategorie und jeden Schritt (z. B. Früchte, Flüssigkeit) werden deine Favoriten bevorzugt, die zu diesem Schritt passen. Schritte ohne passenden Favoriten werden mit der beliebten Standard-Kombination aufgefüllt. Kategorien ganz ohne Favoriten-Treffer werden ausgelassen. Ergebnis sortiert nach Anzahl Favoriten-Treffer.

## Technische Details
- `recipe-builder.tsx`: neues `favoriteCombos` (useMemo) aus `favorites` × Templates × Schritten (gleiche dbIds-Logik wie `popular`, max. Auswahl pro Schritt respektiert, Diät-Filter angewendet); neue `favoritesView` im Stil von `popularView` (SectionTitle ♥ #FBE7EA, LIST_CARD_CLASS, ListCardBody, Badge „♥ n · m Zutaten").
- `FavoritesRow` (Community-Abfrage) wird an diesen Stellen ersetzt; Funktion in `recipe-feed.tsx` entfernt, falls nicht mehr genutzt.
- Neue Texte (`rk.favMatch`, `rk.showAllFav`) in de.ts + 15 Sprachen.
