# Marktspezifische Produktvorschläge im Admin-Panel

## Was du bekommst
- Der bestehende Knopf „✨ Vorschläge“ in einer Kategorie berücksichtigt den oben gewählten Markt (z. B. 🇨🇭 CH).
- Bei gewähltem Markt schlägt die KI fehlende Produkte vor, die **in diesem Land** typisch und relevant sind (z. B. CH: Rivella, Cervelat, Zopf), sortiert nach Relevanz dort, mit lokalen Begriffen.
- Jeder Vorschlag zeigt zusätzlich eine Kennzeichnung:
  - „🌍 global“ – passt in alle Märkte
  - „🇨🇭 nur CH“ – typisch nur für diesen Markt
- Beim Übernehmen wird ein „nur CH“-Vorschlag automatisch als marktspezifisches Produkt angelegt (nur in CH sichtbar); globale Vorschläge wie bisher global. Die Markierung lässt sich vor dem Übernehmen per Tipp umschalten.
- Bei „🌍 Global“ bleibt alles wie bisher.
- Markt-Admins sehen den Markt fest auf ihren Markt gesetzt und können nur marktspezifische Produkte für ihren Markt anlegen (wie bisher geregelt).

## Technische Details
- `suggestProducts` (admin.functions.ts): optionaler Parameter `market` (Code aus MARKETS). Rechteprüfung: Haupt-Admin oder `is_market_admin(uid, market)`. Prompt erweitert um Land, Landessprache/regionale Begriffe; Ausgabe zusätzlich `scope: "global" | "market"`. Namen weiterhin auf Deutsch (Quellsprache), Übersetzung über bestehenden KI-Weg.
- „vorhanden“-Liste bei Markt: nur im Markt sichtbare Produkte (markets leer/enthält Markt, nicht ausgeschlossen), damit ausgeblendete globale Produkte erneut vorgeschlagen werden können (Übernahme hebt dann den Ausschluss auf statt Duplikat anzulegen, bei Namensgleichheit).
- admin.tsx: `loadSuggestions` übergibt `mk`; BulkAddForm zeigt Scope-Badge mit Umschalter; beim Anlegen `markets: scope==="market" ? [mk] : []`.
- i18n: neue Schlüssel `adm.scopeGlobal`, `adm.scopeMarket` in de.ts + messages.json (16 Sprachen).
