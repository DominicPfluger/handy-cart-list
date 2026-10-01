# Handelsmarken zu Produkten

## Was du bekommst
- **Suche findet Marken:** Wer in der Abteilungsansicht „Nutella" eintippt, bekommt „Schoko-Haselnuss-Creme" angezeigt, mit dem Hinweis „Nutella". Das klappt auch für Bounty, Tempo, Ovomaltine usw.
- **Marke wählen:** Tippt man ein Produkt an (im Dialog zum Hinzufügen oder Bearbeiten), erscheinen Marken-Chips wie „Nutella", „Ovomaltine Crunchy Cream" oder „Eigenmarke". Wählt man eine, steht in der Liste z. B. „Schoko-Haselnuss-Creme · Nutella". Ohne Auswahl bleibt alles wie bisher.
- **Pro Land:** Je nach eingestellter Sprache oder Region werden nur die Marken angezeigt, die dort verbreitet sind (z. B. Rivella und Ovomaltine nur in der Schweiz, „Alle Länder" für globale Marken wie Nutella).
- **Admin-Panel, neuer Bereich im Produkt-Editor „Marken":** Marken hinzufügen, umbenennen, löschen, sortieren und die Länder auswählen. Dazu kommt „✨ Marken vorschlagen" für ein einzelnes Produkt.
- **Erstbefüllung:** Die KI schlägt einmal für alle Lebensmittel- und Drogerieprodukte die 0–5 bekanntesten Marken pro Markt vor. Generische Artikel wie Äpfel bleiben ohne Marke.

## Ablauf
1. Neue Tabelle für Marken anlegen, öffentlich lesbar, nur Admins dürfen schreiben.
2. Die Marken werden mit dem Katalog geladen; Suche und Produkt-Dialog nutzen sie.
3. Listeneinträge (Cloud und lokal) können sich die gewählte Marke merken.
4. Marken-Bereich und KI-Vorschlag im Admin-Panel einbauen.
5. Einmalige KI-Erstbefüllung, danach Stichproben (Nutella, Bounty, Tempo, Rivella).
6. Neue Texte in alle 16 Sprachen übersetzen und in der Vorschau testen.

Markennamen werden nicht übersetzt.

## Technische Details
- Tabelle `product_brands` (id, product_id → products, name, locales text[] (leer = alle Märkte), sort_order). Dazu GRANT select an anon/authenticated und all an service_role, RLS mit „public read" und „admin write" über `has_role`.
- Spalte `brand text` in `list_items`; lokale Listen bekommen das gleiche Feld im gespeicherten Objekt.
- `catalog.functions.ts` liefert `brands` pro Produkt. Gefiltert wird im Browser nach aktuellem Locale bzw. Sprachpräfix (de-CH → `de-CH` oder `CH`-Marktcodes; die Speicherung erfolgt als Locale-Codes, z. B. `de-CH`, `fr-CH`).
- Suche in `abteilungen.tsx`: Treffer auch bei passendem Markennamen. Die passende Marke wird als Untertitel angezeigt und beim Hinzufügen vorausgewählt.
- Admin: `saveBrand`, `deleteBrand`, `suggestBrands` in `admin.functions.ts`. Die KI läuft serverseitig über das Lovable AI Gateway mit `openai/gpt-6-astra`.
- Erstbefüllung per Skript in Stapeln, danach Einfügen per SQL.
- Die neuen Bezeichnungen kommen in `de.ts` und `messages.json`.
