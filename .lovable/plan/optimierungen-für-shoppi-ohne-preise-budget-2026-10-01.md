# Optimierungen für Shoppi (ohne Preise & Budget)

Genehmigter Umfang — alle Punkte ausser Preise/Budget:

## 1. Offline-Nutzung (PWA)
- App installierbar machen (Manifest, App-Icon, Service Worker via vite-plugin-pwa)
- Katalog und eigene Listen offline verfügbar halten (Cache-Strategie)
- Änderungen bei schlechtem Netz zwischenspeichern und später automatisch senden (Offline-Queue) statt nur Fehlermeldung

## 2. Schnelleres Nachladen bei geteilten Listen
- Realtime-Abo auf die eigenen Listen begrenzen (filter auf list_ids)
- Nur geänderte Daten nachladen statt sämtliche Listen komplett neu zu laden
- Ergebnis: weniger Wartezeit, Datenverbrauch, Flackern

## 3. Katalog-Abruf verschlanken
- catalog_translations nur für die aktive Sprache laden (statt alle 16)
- Bilder-Adressen (Signed URLs) günstiger erneuern statt alle 10 Minuten den ganzen Katalog neu zu laden

## 4. Lade- und Sicherheitszustände
- Ladeanzeige beim ersten Öffnen statt leerem Bildschirm (pendingComponent/Suspense-Fallback)
- „Rückgängig"-Toast nach dem Entfernen eines Eintrags und nach „Einkauf abschliessen"
- Bessere Screenreader-Beschriftungen (aria-pressed, role=tab) bei Listen-Auswahl und Schaltern

## 5. Code-Wartung (unsichtbar)
- Doppelte Listen-Logik (lokal/Cloud) in use-shopping-list.ts (1148 Zeilen) auf Adapter-Muster zusammenführen
- Gemeinsamer toItemRow-Helper in lists.functions.ts (4× dupliziert)
- Typen statt „any" bei Listen-Daten

## Technische Details
- vite-plugin-pwa installieren; Manifest + Icons in public/; Workbox-Cache für Katalog-API; Offline-Queue in use-shopping-list (localStorage-Queue + retry bei online)
- Realtime: postgres_changes mit filter `list_id=in.(...)`; gezieltes Refetch der betroffenen Liste
- Katalog: catalog.functions.ts lädt catalog_translations gefiltert per Locale; Signed-URL-Refresh als separater leichter Aufruf
- UX: sonner Toast mit Undo-Aktion; index.tsx pendingComponent; role=tab/aria-pressed auf Listen-Switcher
