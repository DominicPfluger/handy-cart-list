# „Produkte ohne Bild" in den Bilder-Tab verschieben

## Ziel
Die Bild-Pflege („Produkte ohne Bild") steht heute unter „Pflege". Sie soll in den Tab „Bilder" (Medien) ziehen und dort ganz oben erscheinen.

## Änderungen
- `src/components/admin/catalog-media-panel.tsx`: `MissingImagesPanel` importieren und im Bilder-Abschnitt ganz oben rendern (über den bisherigen Medien-Inhalten). Dafür erhält das Panel die nötigen Daten (`depts`, `prods`, `onEdit`) — analog zur bisherigen Einbindung in der Pflege.
- `src/routes/_authenticated/admin.tsx`: Beim Rendern des Bilder-Tabs werden `depts`, `prods` und der `onEdit`-Callback an `CatalogMediaPanel` durchgereicht.
- `src/components/admin/catalog-health-panel.tsx`: `MissingImagesPanel`-Import und -Rendern entfernen; die übrigen Pflege-Bereiche (Datenlücken etc.) bleiben unverändert.

## Nicht geändert
- Funktionen der Bild-Pflege (Suche, Kategorienfilter, KI-Bildoptionen, Schnell-Bild, Bild aus Datenbank, Stapelmodus) bleiben exakt wie bisher.
- Der Tab „Pflege" bleibt mit seinen übrigen Inhalten bestehen.

## Prüfung
- Typprüfung und Build.
- Browser-Test: Bilder-Tab zeigt „Produkte ohne Bild" zuoberst; Pflege-Tab zeigt es nicht mehr.
