# Community-Rezepte nach oben in der Rezeptansicht

## Ziel
Auf der Rezept-Inspirationen-Seite (`/rezepte/inspirationen`) erscheint der Block „Community-Rezepte" nicht mehr am Seitenende, sondern direkt unter dem Seitentitel als erster Inhalt.

## Aktuelle Reihenfolge
1. Titel „Rezept-Inspirationen" + Zurück-Link
2. Favoriten-Reihe (FavoritesRow)
3. Rezept-Feed (RecipeFeed)
4. Rezept-Generator (RecipeBuilder)
5. Überschrift „🌍 Community-Rezepte" + CommunitySection

## Neue Reihenfolge
1. Titel „Rezept-Inspirationen" + Zurück-Link
2. Überschrift „🌍 Community-Rezepte" + CommunitySection
3. Favoriten-Reihe
4. Rezept-Feed
5. Rezept-Generator

## Umsetzung
Datei: `src/routes/rezepte.inspirationen.tsx`
- Den Überschriften-Block (🌍 Community-Rezepte) und `<CommunitySection />` oberhalb von `<FavoritesRow />` verschieben.
- Beim Verschieben die Trennlinie-Klassen des Blocks anpassen: oben kein `border-t border-border pt-5` nötig (er trennte nur den unteren Abschnitt); danach erhält der nachfolgende Feed-Bereich wieder eine dezente Abtrennung, damit die Seite optisch gegliedert bleibt.

## Verifikation
- Typprüfung `bunx tsgo --noEmit`.
- Browser-Check: Seite öffnen und bestätigen, dass die Community-Rezepte direkt unter dem Titel erscheinen und Feed/Generator darunter folgen.
