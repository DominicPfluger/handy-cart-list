# Fehlende Produkte vorschlagen – mit Websuche

Der Knopf „Fehlende Produkte vorschlagen“ im Admin-Panel nutzt heute schon KI, die aber nur aus ihrem eigenen Wissen schöpft. Neu kann sie zusätzlich echte Supermarkt-Sortimente im Internet durchsuchen und daraus fehlende Produkte vorschlagen.

## Bedienung

- Im Vorschlags-Bereich erscheint ein Schalter **„Mit Websuche“** (standardmässig aus, weil die Suche langsamer ist und mehr Credits kostet).
- Ist er an, durchsucht die App Online-Shops von Supermärkten im gewählten Markt (z. B. Migros/Coop für CH, Rewe/Edeka für DE, Billa/Spar für AT; bei anderen Märkten die dort aktiven Supermärkte aus der Marktverwaltung) nach der Kategorie.
- Die KI gleicht die gefundenen Produkte mit dem bestehenden Katalog ab und schlägt nur fehlende vor – sortiert nach Relevanz.
- Jeder Vorschlag zeigt zusätzlich die Quelle (z. B. „gefunden bei Coop“). Übernehmen funktioniert wie bisher.
- „Mehr laden“ (+10) funktioniert auch im Websuche-Modus.
- Liefert die Websuche nichts (Shop blockiert, keine Treffer), fällt die Funktion automatisch auf die heutige KI-Suche zurück und sagt das kurz an.

## Voraussetzung

Für die Websuche wird der Dienst **Firecrawl** verbunden (Suche und Seitenauslesen im Internet). Beim Umsetzen fordere ich die Verbindung an; du bestätigst sie mit einem Klick.

## Technische Details

- Connector `firecrawl` verbinden; `FIRECRAWL_API_KEY` nur serverseitig.
- `suggestProducts` (admin.functions.ts) erhält optional `web: boolean`. Bei `web`: Firecrawl-Search (`/v2/search`) mit 2–3 Abfragen wie „<Kategorie> site:<shop-domain>“, Top-Ergebnisse als Markdown (gekürzt), dann `aiJson` mit Rohtext + vorhandenen/auszuschliessenden Namen; Antwort-Schema um `source` erweitert.
- Shop-Domains je Markt als kleine Zuordnung im Server-Code, ergänzt um Namen aus `supermarkets`.
- Fehlerbehandlung: Firecrawl-Fehler oder leere Treffer → bisheriger Prompt ohne Webkontext, Hinweisflag `webFallback` an die Oberfläche.
- UI (catalog-tile-editor.tsx, Vorschlags-Panel): Schalter, Quellen-Hinweis je Vorschlag, Fallback-Hinweis.
- i18n-Schlüssel in de.ts + allen 15 Lokalen.
- Test: eine Kategorie (z. B. Gemüse, Markt CH) mit und ohne Websuche im Browser prüfen.

## Nicht Teil

- Keine automatische Websuche beim Öffnen (nur auf Knopfdruck).
- Keine Preise oder Bilder aus der Websuche übernehmen.
