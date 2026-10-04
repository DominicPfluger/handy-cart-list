# „Katalog als Text kopieren" unterhalb von Datenlücken

## Ist-Zustand (geprüft)
Im Admin-Tab „Pflege" (`catalog-health-panel.tsx`) steht der Knopf „Katalog als Text kopieren" (`adm.copyCatalog`) in der Kopfzeile neben der Überschrift „Datenlücken" (Zeile 214).

## Änderung
- Der Knopf wandert aus der Kopfzeile ans Ende des Abschnitts „Datenlücken" — unterhalb der Lücken-Karten bzw. der aufgeklappten Liste.
- Die Kopfzeile zeigt danach nur noch die Überschrift.
- Der Dialog zum Kopieren (`CatalogTextDialog`) und die Text-Erzeugung bleiben unverändert.

## Technik
- `src/components/admin/catalog-health-panel.tsx`: Button-Verschiebung, sonst nichts.
- Prüfung: `bunx tsgo --noEmit`, Build-Log, kurzer Browser-Check im Pflege-Tab.
