# Optimierungsvorschläge für Shoppi

Aus der Analyse der App ergeben sich diese Vorschläge — geordnet nach Nutzen. Du wählst aus, was ich umsetzen soll.

## 1. Offline-Nutzung (PWA) — grösster Gewinn
Die App wird im Laden benutzt, oft mit schlechtem Empfang. Heute gibt es keinerlei Offline-Unterstützung.
- App installierbar machen (Manifest, App-Icon, Service Worker)
- Katalog und eigene Listen offline verfügbar halten
- Änderungen bei schlechtem Netz zwischenspeichern und später automatisch senden, statt nur eine Fehlermeldung zu zeigen

## 2. Schnelleres Nachladen bei geteilten Listen
Heute lädt die App bei jeder Änderung (auch fremder) sämtliche Listen komplett neu.
- Nur die geänderte Liste/das geänderte Element nachladen
- Änderungen auf die eigenen Listen begrenzen
- Ergebnis: weniger Wartezeit, weniger Datenverbrauch, weniger Flackern

## 3. Katalog-Abruf verschlanken
Der Katalog lädt alle Übersetzungen aller 16 Sprachen mit, obwohl nur eine angezeigt wird.
- Nur die aktive Sprache laden
- Bilder-Adressen günstiger erneuern statt alle 10 Minuten den ganzen Katalog neu zu laden
- Ergebnis: schnellerer Start, weniger Datenvolumen

## 4. Lade- und Sicherheitszustände in der Liste
- Ladeanzeige beim ersten Öffnen statt leerem Bildschirm
- Kurzes „Rückgängig" nach dem Entfernen eines Eintrags oder nach „Einkauf abschliessen"
- Bessere Screenreader-Beschriftungen bei Listen-Auswahl und Schaltern

## 5. Preise & Budget (optional, grösseres Feature)
- Preiskategorien pro Produkt (billig → exquisit), automatisch per KI zugeordnet, Admin kann korrigieren
- Optional später: geschätzte Listensumme und Budget-Anzeige

## 6. Code-Wartung (unsichtbar, aber sinnvoll)
- Doppelte Listen-Logik (lokal/Cloud) zusammenführen — weniger Fehlerquellen
- Typen statt „any" bei Listen-Daten

## Technische Details
- PWA: vite-plugin-pwa, Manifest + Icons in public/, Cache-Strategie für Katalog-API, Offline-Queue für Listen-Mutationen
- Realtime: filter auf eigene list_ids, gezieltes Nachladen statt getMyLists-Vollreload
- Katalog: catalog_translations per Locale filtern; Signed-URL-Refresh separat
- UX: pendingComponent/Suspense-Fallback, Undo-Toast (sonner), aria-pressed/role=tab
- Refactor: use-shopping-list.ts (1148 Zeilen) auf Adapter-Muster; shared toItemRow-Helper in lists.functions.ts
