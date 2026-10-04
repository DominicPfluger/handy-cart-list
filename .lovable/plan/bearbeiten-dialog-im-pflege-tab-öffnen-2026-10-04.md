# Bearbeiten-Dialog im Pflege-Tab öffnen

## Problem
Im Admin-Panel unter „Pflege" öffnet der Knopf „Bearbeiten" (z. B. bei „Fehlende Übersetzungen") keinen Dialog. Im Browser bestätigt: Klick wird registriert, aber kein Dialog erscheint.

## Ursache
In `src/routes/_authenticated/admin.tsx` liegt der Bearbeitungsdialog (`Editor`, Zeilen ~872–910) **innerhalb** der Bedingung `{tab === "catalog" && (…)}`, die erst bei Zeile 912 mit `</>)}` schliesst. Der Pflege-Tab setzt beim Klick auf „Bearbeiten" korrekt die Auswahl (`setSel`), aber der Dialog wird nur gerendert, solange der Katalog-Tab aktiv ist — im Pflege-Tab also nie. Gleiches gilt für den „Bearbeiten"-Knopf im Bilder-Tab („Produkte ohne Bild").

## Fix
- Den Editor-Block (und den Sortier-Dialog-Block davor) aus der Katalog-Bedingung herausziehen und danach auf oberster Ebene rendern, sodass der Dialog unabhängig vom aktiven Tab erscheint.
- Keine Änderung an Logik, Props oder Texten — reines Verschieben des bestehenden Blocks.

## Betroffene Datei
- `src/routes/_authenticated/admin.tsx`

## Prüfung
- Typprüfung (`bunx tsgo --noEmit`) und Build-Log.
- Browser-Test als Admin: Pflege → „Fehlende Übersetzungen" aufklappen → „Bearbeiten" → Dialog mit dem Produkt (z. B. „Zopf") öffnet sich; ebenso aus dem Bilder-Tab.
