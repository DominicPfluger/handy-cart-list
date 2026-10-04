# KI-Bildoptionen: klare Auswahl „ein Bild" oder „zwei unterschiedliche Bilder"

## Ziel
Im Dialog „KI-Bildoptionen" (Pflege → Produkte ohne Bild) soll klar beschriftet wählbar sein, ob nur ein Bild erzeugt wird (das Icon wird daraus abgeleitet) oder zwei unterschiedliche Bilder (grosses Produktbild + eigenes KI-Icon).

## Umsetzung
- `src/components/admin/missing-images-panel.tsx`:
  - Die zwei Knöpfe „KI-Bild erzeugen" / „Beide Bilder mit KI erzeugen (2 Credits)" werden ersetzt durch:
    1. Eine Auswahl (Radio-Gruppe) mit zwei klar beschrifteten Optionen:
       - „Ein Bild erzeugen — Icon wird aus dem Bild abgeleitet (1 Credit)"
       - „Zwei unterschiedliche Bilder erzeugen — Bild und Icon je eigene KI-Erzeugung (2 Credits)"
    2. Einem einzigen Knopf „Bild erzeugen", der die gewählte Variante ausführt.
  - Der Dialog-Zustand (`Dlg`) erhält ein Feld `both: boolean` (Standard: ein Bild); `runDlg`/`runDlgBoth` werden zu einer Funktion zusammengeführt.
  - Gilt gleichermassen für den Dialog pro Produkt und für den Stapel-Lauf „Alle n mit KI erzeugen" (derselbe Dialog, `target: null`).
- i18n: neue Schlüssel in `src/i18n/de.ts` und allen 15 Locales in `messages.json`:
  - `adm.noImg.modeOne`: „Ein Bild erzeugen (Icon wird abgeleitet, 1 Credit)"
  - `adm.noImg.modeTwo`: „Zwei unterschiedliche Bilder erzeugen (2 Credits)"
  - `adm.noImg.generate`: „Bild erzeugen"
  - Die alten Schlüssel `adm.noImg.gen`/`genBoth` werden entfernt bzw. durch die neuen ersetzt.

## Verifikation
- Typprüfung und Build fehlerfrei.
- Browser-Test als Admin: Dialog zeigt die Auswahl mit beiden Beschriftungen, Standard ist „Ein Bild", die Ausführung erzeugt je nach Wahl 1 oder 2 Bilder.
