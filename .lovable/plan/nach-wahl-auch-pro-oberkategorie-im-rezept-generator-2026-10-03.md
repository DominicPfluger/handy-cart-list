# „… nach Wahl" auch pro Oberkategorie im Rezept-Generator

Im Rezept-Generator gibt es heute pro Zutatenbereich (z. B. „Teig") einen Eintrag „… nach Wahl". Neu bekommt auch jede graue Oberkategorie (z. B. „Teigzutaten", „Hartkäse") einen eigenen „… nach Wahl"-Eintrag — z. B. „Hartkäse nach Wahl".

## Umsetzung

**Datei: `src/components/recipe-builder.tsx`**

1. **Neuer Eintrag pro Oberkategorie:** In jeder aufgeklappten Oberkategorie erscheint zuoberst ein gestrichelter Chip „{Kategoriename} nach Wahl" (Kennung `any:{schritt}:{kategorie}`), gleiches Aussehen und Verhalten wie der bestehende Bereichs-Eintrag. Bei Kategorien ohne Namen („Weitere") entfällt er.

2. **Zählt wie eine Zutat:** Der Eintrag zählt für Mindest-/Höchstzahlen des Bereichs, erfüllt Pflichtbereiche und lässt sich mit echten Zutaten kombinieren.

3. **Überall sichtbar:** Gewählte „nach Wahl"-Einträge erscheinen in der Übersicht im Bereichs-Kopf, im gespeicherten/geteilten Rezept als Zutat und landen als normaler Eintrag (z. B. „Hartkäse nach Wahl") auf der Einkaufsliste. Beim erneuten Öffnen eines Rezepts bleiben sie ausgewählt.

4. **„Überraschen"** wählt diese Einträge nie automatisch (wie bisher).

5. **Übersetzungen:** Der bestehende Text `rk.anyOf` („{name} nach Wahl") wird wiederverwendet — keine neuen Texte nötig.

## Technisch

- `anyProduct`-Helfer wird um eine Gruppen-Variante ergänzt; die Stellen `chosen`, Bereichs-Kopf-Chips, `addAll` und `recipeItems` lösen die neuen Kennungen auf (Name aus der Oberkategorie).
- Kein Datenbank-Change (Kennung liegt in `picks`/`items` wie bisher), keine KI, keine Credits.
- Danach: Typprüfung, Build, Browser-Test (Pizza: Oberkategorie aufklappen → „… nach Wahl" wählen → erscheint im Kopf und auf der Einkaufsliste).
