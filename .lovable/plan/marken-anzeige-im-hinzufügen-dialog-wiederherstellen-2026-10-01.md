# Marken-Anzeige im Hinzufügen-Dialog wiederherstellen

## Befund
Die Marken-Funktion ist im Code und in der Datenbank intakt (2981 Marken für 1295 Produkte; Live-Test in der Vorschau zeigt „Marke (optional): Nutella" im Dialog). Dass du bei allen Produkten keine Marken siehst, hat zwei wahrscheinliche Ursachen:

1. **Veralteter Katalog-Zwischenspeicher:** Der Katalog wird bis zu 45 Minuten im Browser zwischengespeichert. Wer die App seit vor der Marken-Einführung offen hat, lädt die Marken nicht nach.
2. **Markt-Filter ohne Fallback:** `brandsFor()` filtert Marken streng nach dem Ländercode der gewählten Sprachvariante (z. B. de-CH → CH). Passt der Code nicht (z. B. Sprachvariante ohne Region), erscheinen nur die wenigen globalen Marken — bei vielen Produkten gar keine.

## Was gebaut wird

### 1. Fallback bei der Markt-Filterung
- `brandsFor()` in `src/lib/catalog-query.ts`: Zeigt zuerst die Marken des eigenen Markts plus globale Marken. Gibt es für den eigenen Markt keine Treffer, werden alle Marken des Produkts angezeigt statt gar keiner.

### 2. Katalog-Aktualisierung sicherstellen
- Der Katalog-Zwischenspeicher wird beim App-Start einmal verworfen, wenn er älter als die aktuelle Datenversion ist (Invalidierung über `refetchInterval` verkürzen bzw. `staleTime` senken), damit neue Katalogdaten wie Marken zuverlässig ankommen.

### 3. Prüfung
- In der Vorschau: Suche nach „Nutella", Dialog öffnen, Marken-Chip sichtbar; zusätzlich ein Produkt mit marktspezifischen Marken (z. B. Rivella) testen.

## Technische Details
- Datei: `src/lib/catalog-query.ts` (`brandsFor`-Fallback), ggf. `staleTime`/`refetchInterval` in `catalogQueryOptions` anpassen.
- Keine Datenbank-Änderung nötig — die Marken-Daten sind vorhanden.
