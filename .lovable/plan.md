# Fehlende-Produkte-Dialog im Admin optimieren – Vorschläge

So sieht der Dialog heute aus: Textfeld, Knopf „Vorschlagen“, Bestätigungsfenster (Web/KI) und eine Häkchenliste. Danach musst du „Übernehmen“ und anschliessend „X anlegen“ tippen. Emoji, Menge und Einheit gelten für alle Produkte gleich.

## A. Weniger Klicks
1. **Direkt anlegen:** Neuer Knopf „Ausgewählte anlegen“ direkt unter der Vorschlagsliste. Der Umweg über das Textfeld entfällt.
2. **Alle / keine:** Ein Schalter hakt alle Vorschläge an oder ab, dazu ein Zähler „8 von 12 gewählt“.
3. **Letzte Wahl merken:** Web oder KI wird auf dem Gerät gespeichert und beim nächsten Mal vorausgewählt.

## B. Bessere Vorschläge
4. **Synonyme ausschliessen:** Eingetragene Synonyme (z. B. Tesafilm) werden nicht mehr vorgeschlagen. Das ist eine bekannte Lücke.
5. **Stichwortfeld im Bestätigungsfenster** (z. B. „italienisch, Bio“), damit die Suche gezielter wird.
6. **Anzahl wählbar:** 10, 20 oder 30 Vorschläge. Die Kosten bleiben pro Lauf gleich.
7. **„+ 10 weitere“:** Hängt neue Vorschläge an, ohne Wiederholungen. Vor dem Laden wird wie bisher nachgefragt.
8. **Relevanz:** Jeder Vorschlag bekommt ★★★/★★/★, und die Liste ist danach sortiert.

## C. Pro Vorschlag mehr Kontrolle
9. **Eigenes Emoji, Menge und Einheit je Vorschlag:** Die KI liefert diese Werte mit. Sie stehen in jeder Zeile und lassen sich dort ändern, statt einen Wert für alle zu setzen.
10. **Name vor dem Anlegen umbenennen:** Antippen, um Tippfehler oder Schreibweise zu korrigieren.
11. **„Existiert schon woanders“:** Erkennt die App, dass ein Produkt bereits in einer anderen Kategorie steht, zeigt sie das an. Statt eines Duplikats wird es dann als Verknüpfung hinzugefügt.

## D. Übersicht
12. **Eigenes Fenster statt Einbettung:** Die Liste öffnet sich in einem grösseren, scrollbaren Fenster mit fester Knopfleiste unten. Lange Gründe werden nicht mehr abgeschnitten, sondern lassen sich aufklappen.
13. **Ladeanzeige mit Abbrechen:** Während die Websuche läuft, zeigt das Fenster „Suche in Shops… / KI wertet aus…“.

## Empfehlung
Zuerst 1, 2, 4, 9 und 11 umsetzen: Das bringt am meisten bei wenig Aufwand und ohne zusätzliche Credits. 5–8 und 12 lassen sich gut danach ergänzen. Sag mir, welche Nummern du willst, oder genehmige die Empfehlung.

## Technische Details
- `admin.tsx` → `BulkAddForm`: direkter Submit aus `sugs`, je Zeile Zustand für Emoji, Menge, Einheit und Name, „alle/keine“, Modus in localStorage.
- `admin.functions.ts` → `suggestProducts`: Die `existing`-Liste wird um `product_synonyms` erweitert. Das Antwortschema bekommt `emoji/quantity/unit/relevance` und `existingId` (Abgleich über den normalisierten Namen im ganzen Katalog). Bei `existingId` wird ein `product_aliases`-Eintrag statt eines neuen Produkts angelegt.
- `onSubmit` erhält je Produkt eigene Werte statt gemeinsamer Werte.
- Neue Texte in de.ts und allen 15 Sprachen. Keine Datenbankänderung.
- Test: Die Bestätigung erscheint, Abbrechen löst keinen Aufruf aus, und genau ein echter Lauf wird gemacht.
