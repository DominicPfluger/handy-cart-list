# „Nach Wahl“-Option im Rezept-Generator

## Ziel
Jeder Zutatenbereich im Rezept-Generator bekommt einen festen Eintrag „… nach Wahl“, zum Beispiel „Teig nach Wahl“ bei Pizza oder „Flüssigkeit nach Wahl“ bei Smoothie. So bleibt das Rezept an dieser Stelle offen.

## Verhalten
- Der Eintrag steht in jedem Zutatenbereich als erstes Feld, vor den grauen Kategorien. Er hat einen gestrichelten Rahmen und das Emoji des Bereichs, z. B. „🫓 Teig nach Wahl“.
- Er zählt wie eine gewählte Zutat. Damit sind Pflichtbereiche erfüllt und die Mindest- und Höchstzahl gilt wie gewohnt.
- Er lässt sich mit konkreten Zutaten kombinieren, solange die Höchstzahl es erlaubt.
- **Einkaufsliste:** Der Eintrag wird als normaler Listeneintrag „Teig nach Wahl“ übernommen, ohne Verknüpfung mit einem bestimmten Produkt.
- **Gespeicherte und geteilte Rezepte:** „Teig nach Wahl“ erscheint dort als Zutat. Bei der Suche nach Rezepten mit deinen Favoriten zählt der Eintrag nicht mit.
- **„Überraschen“** und die beliebten Kombinationen wählen ihn nicht automatisch.
- Alle Texte werden in den 16 App-Sprachen übersetzt.

## Technische Details
- Platzhalter-ID je Bereich: `any:<stepKey>`. Sie wird in `picks` gespeichert wie eine Produkt-ID.
- `recipe-builder.tsx`: Den Eintrag in jedem Schritt rendern, Mindest-/Höchstzahl beachten und im Kopf des Bereichs anzeigen. `chosen`/`recipeItems()` erzeugen dafür ein Item mit `productId: "any:<key>"` und dem Namen aus `rk.anyOf` („{name} nach Wahl“).
- `recipes-api.ts`: `product_ids` filtert die `any:`-IDs heraus, weil die Spalte nur echte Produkt-IDs (uuid[]) aufnimmt. In `items` bleibt der Eintrag erhalten.
- Übergabe an die Einkaufsliste: Für `any:` wird ein Eintrag ohne `product_id` und nur mit Namen angelegt. Die Rezept-Detailseite und das Wieder-Öffnen (`openRecipe`) tolerieren `any:`-IDs.
- Die Zufallsauswahl und die beliebten Kombinationen schliessen `any:` aus.
- i18n: `rk.anyOf` in `de.ts` und allen 15 Sprachen.
- Keine Datenbankänderung.
- Prüfung mit Typcheck, Build und einem Browser-Test: Bei Pizza „Teig nach Wahl“ wählen und das Rezept auf die Einkaufsliste übernehmen.
