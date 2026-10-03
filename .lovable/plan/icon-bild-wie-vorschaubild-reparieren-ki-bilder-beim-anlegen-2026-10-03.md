# „Icon-Bild wie Vorschaubild“ reparieren + KI-Bilder beim Anlegen neuer Produkte

## Teil 1: Knopf „Icon-Bild wie Vorschaubild“

### Befund (im Code geprüft)
- Der Knopf weiss nur, welches Vorschaubild beim **Öffnen** des Dialogs hinterlegt war.
- Wird im offenen Dialog ein neues Vorschaubild hochgeladen, ausgewählt oder per KI erzeugt, bekommt der Knopf das nicht mit. Er bleibt dann ausgegraut oder übernimmt das **alte** Bild.
- Bei neu angelegten Produkten lädt der Dialog die Bilddaten gar nicht, daher bleibt der Knopf ausgegraut.
- Fehler werden nicht angezeigt.

Ob das genau dein Fall ist, ist noch nicht bestätigt. Deshalb wird der Fehler zuerst im Browser nachgestellt.

### Lösung
1. Den Fehler im Browser nachstellen und festhalten.
2. Nach jedem Hochladen, Auswählen, KI-Erzeugen oder Entfernen des Vorschaubilds liest der Dialog die Bilddaten neu ein.
3. Die Bilddaten werden auch geladen, sobald ein neues Produkt gespeichert ist.
4. Rückmeldung: „Icon übernommen“ bei Erfolg, sonst eine verständliche Fehlermeldung.

## Teil 2: KI-Bild im Formular „Produkt hinzufügen“
- Neues Häkchen **„✨ KI-Bilder erzeugen“** (standardmässig aus).
- Ist es aktiv, erscheinen dieselben **KI-Bild-Optionen** wie im Bild-Dialog: Stichworte, Stil, Hintergrund, Ansicht, Anzahl.
- Beim Hinzufügen kommt zuerst die Frage: „Für X neue Produkte KI-Bilder erzeugen? Dies verbraucht Credits.“
- Die Bilder werden danach nacheinander im Hintergrund erzeugt, mit Fortschrittsanzeige („Bild 2 von 5“). Das kleine Icon entsteht automatisch mit.
- Bei einem Fehler, zum Beispiel wenn das Guthaben aufgebraucht ist, stoppt der Vorgang und meldet das. Die Produkte selbst bleiben gespeichert.
- Es gilt die bekannte Stilregel: keine Kräuter, keine Zusätze, keine Gefässe.

## Technische Details
- `catalog-tile-editor.tsx`: `useEffect` auf `effId` statt `p.target.id`. Nach Upload, Auswahl, `generateDialogImage` und Entfernen jeweils `loadIcon(effId)`. `useImageAsIcon` liest `image_path` frisch aus der Datenbank und zeigt einen Toast bei Erfolg und Fehler.
- `_authenticated/admin.tsx`: In `BulkAddForm` kommen ein Häkchen und ein `imgOpts`-State hinzu (die Options-Auswahl wird als kleine gemeinsame Komponente aus dem Bild-Dialog übernommen). `onSubmit` erhält zusätzlich `ai?: { hint, opts }`. `handleBulkSubmit` gibt die IDs der neuen Produkte zurück. Danach folgt eine Schleife: `generateImageFor({id, kind:"product", hint, opts})` → `saveProductIconFromPath` → Neuladen des Katalogs. Abbruch beim ersten Fehler (402/403).
- i18n: `adm.aiImagesNew`, `adm.aiImagesConfirm`, `adm.aiImagesProgress`, `adm.iconUseImageDone` in de.ts und allen 15 Lokalen.
- `roadmap.md` um beide Aufgaben ergänzen. Keine Änderungen an der Datenbank.
