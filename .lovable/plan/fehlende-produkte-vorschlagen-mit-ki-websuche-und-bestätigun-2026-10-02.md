# „Fehlende Produkte vorschlagen“ mit KI-Websuche und Bestätigung

## Ziel
Der Knopf „Fehlende Produkte vorschlagen“ sucht Produkte, die zur gewählten Kategorie passen und dort noch fehlen. Neu laufen dabei eine Websuche und eine KI-Auswertung. Bevor Credits verbraucht werden, fragt die App immer zuerst nach.

## Ablauf für dich
1. Kategorie öffnen und auf „Fehlende Produkte vorschlagen“ klicken.
2. Ein Bestätigungsfenster erscheint:
   - Kategorie (z. B. „Früchte › Exotische Früchte“) und gewählter Markt
   - Hinweis: „Diese Suche verbraucht KI- und Web-Credits (1 Websuche + 1 KI-Auswertung).“
   - Auswahl: **Mit Websuche** (genauer, teurer) oder **Nur KI** (günstiger, wie bisher)
   - Knöpfe „Suche starten“ und „Abbrechen“
3. Erst nach „Suche starten“ läuft die Suche. Die Vorschläge erscheinen wie bisher in der Liste zum Abhaken und Hinzufügen.
4. Ein „Mehr laden“ oder erneutes Suchen fragt jedes Mal neu nach.

## Was sich ändert
- Das Hinzufügen-Formular startet die KI-Suche nicht mehr automatisch beim Öffnen. Heute passiert das beim Öffnen über den Vorschlags-Knopf.
- **Websuche:** Online-Sortimente des gewählten Markts (z. B. Coop/Migros für CH, REWE/Edeka für DE) werden nach der Kategorie durchsucht. Die KI wählt daraus Produkte aus, die im Katalog noch fehlen. Vorhandene Produkte, Synonyme und Produkte aus Nachbarkategorien werden ausgeschlossen.
- Liefert die Websuche nichts, z. B. weil ein Shop blockiert, gibt es einen Hinweis. Die Vorschläge kommen dann nur von der KI, ohne weitere Kosten für die Websuche.
- Jeder Vorschlag zeigt bei Websuche klein die Fundstelle (Shopname).

## Technische Details
- `suggestProducts` (admin.functions.ts) bekommt den Parameter `mode: "web" | "ai"`.
  - Bei `web`: Firecrawl-Search über das bestehende Connector-Gateway, wie in `import.server.ts`, mit der Anfrage „<Kategorie> <Markt> Supermarkt online kaufen“. Die besten 5 Treffer werden als Markdown geholt, auf etwa 30k Zeichen gekürzt und zusammen mit vorhandenen Produkten, Synonymen und Ausschlüssen an `aiJson` übergeben. Das Ergebnis enthält `source`.
  - Bei Firecrawl-Fehlern (402/403/Blockade) folgt ein Rückfall auf `ai` mit dem Flag `webFailed`.
- Synonyme aus `product_synonyms` werden zur `existing`-Liste hinzugefügt.
- `admin.tsx`: `autoSuggest` wird entfernt. Ein neuer Bestätigungsdialog (kompaktes Overlay wie beim Überschriften-Dialog) wird vor jedem `loadSuggestions`-Aufruf eingeblendet, auch in der Kachelansicht.
- Neue i18n-Texte `adm.suggestConfirm*` in de.ts und allen 15 Sprachen.
- Test: Kategorie öffnen → Dialog erscheint → Abbrechen löst keinen Aufruf aus. Danach ein einziger echter Lauf „Mit Websuche“, um die Kosten gering zu halten.
