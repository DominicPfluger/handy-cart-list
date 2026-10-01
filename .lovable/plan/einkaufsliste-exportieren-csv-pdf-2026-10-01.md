# Einkaufsliste exportieren (CSV, PDF)

## Wichtiger Hinweis vorab
Die meisten Online-Supermärkte, zum Beispiel Migros, Coop, REWE oder Lidl, können keine Dateien in den Warenkorb importieren. Die CSV-Datei hilft trotzdem: Du kannst sie in Excel oder Numbers öffnen und die Artikel nacheinander in die Suche des Shops kopieren. Darum gibt es zusätzlich „Als Text kopieren", das ist meistens der schnellste Weg.

## Was du bekommst
- Neben dem Teilen- und dem Vorlesen-Button beim Listentitel gibt es einen neuen **Exportieren**-Button.
- Er öffnet eine Auswahl mit drei Möglichkeiten:
  - **CSV-Datei:** Spalten Artikel, Menge, Einheit, Marke, Bio, Kategorie und Notiz. Die Datei öffnet sich in Excel mit korrekten Umlauten und Semikolon als Trennzeichen.
  - **PDF:** eine druckfreundliche Liste mit Listenname, Datum und Abteilungen in derselben Reihenfolge wie in der App. Neben jedem Artikel steht ein Kästchen zum Abhaken.
  - **Als Text kopieren:** ein Artikel pro Zeile mit Menge, bereit zum Einfügen.
- Vorher wählst du per Schalter, ob abgehakte Artikel mitkommen. Standardmässig werden nur offene Artikel exportiert.
- Artikelnamen und Mengen erscheinen in der eingestellten App-Sprache. Der Dateiname ist der Listenname mit Datum, zum Beispiel `Wocheneinkauf-2026-10-01.csv`.
- Das funktioniert für lokale und für geteilte Listen. Die Dateien entstehen direkt auf dem Gerät, ohne Server.

## Technische Details
- Neue Komponente `src/components/export-list-sheet.tsx`. Sie bekommt dieselben gruppierten Daten wie `SpeakListButton`: Abteilung mit Artikeln, Anzeigename, Menge über `relocalizeQuantity` sowie Marke, Bio und Notiz.
- CSV: UTF-8 mit BOM, Trennzeichen `;`, Felder in Anführungszeichen. Download über einen Blob-Link.
- PDF: `jspdf` wird erst beim Klick geladen (`import()`), damit die App nicht langsamer startet. Dazu kommt die Standardschrift mit Umlaut-Unterstützung, automatische Seitenumbrüche und Abteilungsüberschriften in Fett.
- Text kopieren: `navigator.clipboard.writeText` mit einem Hinweis-Toast.
- Die Marke wird aus dem Namensteil „Name · Marke" gelesen, so wie sie heute gespeichert ist.
- Eingebunden in `src/routes/index.tsx` neben dem `SpeakListButton`.
- Neue i18n-Keys (`export.*`) in `de.ts` und allen 15 Sprachvarianten.
