# Kleine Abteilungs-Icons in der Abteilungs-Reihenfolge (Einstellungen)

## Ziel
Unter Einstellungen → Abteilungs-Reihenfolge zeigt jede Zeile statt nur dem Emoji das kleine Abteilungs-Icon (kleines PNG, wo vorhanden), sonst das grosse Bild, sonst Emoji. Gilt für die sichtbaren und die ausgeblendeten Einträge.

## Änderungen
Nur eine Datei: `src/components/store-order-settings.tsx`

- `DepartmentIcon` aus `src/components/catalog-icon.tsx` importieren (gleiche Komponente wie bei Favoriten-Kategorien).
- Beim Aufbau der Abteilungsliste (`roots` / `hiddenRoots`) zusätzlich `imageUrl: d.iconUrl ?? d.imageUrl` und `imagePath: d.iconPath ?? d.imagePath` mitgeben — kleines Icon bevorzugt, Fallback aufs grosse Bild.
- Die Zeilen-Komponente `Row` ersetzt den Emoji-`<span>` durch `DepartmentIcon` (ca. 24×24 px, Emoji-Fallback `text-lg`).
- Genauso in der Liste „Ausgeblendet".

## Verhalten
- Respektiert weiterhin die geräte-lokale Einstellung „Icons als Bilder oder Symbole" (`useIconSet`): wer Symbole gewählt hat, sieht weiterhin Emojis.
- Keine Datenbank- oder Server-Änderung; rein clientseitig.
- i18n: keine neuen Texte nötig.

## Verifikation
- Typprüfung + Build.
- Browser-Test: Einstellungen → Abteilungs-Reihenfolge aufklappen; Zeilen zeigen die kleinen Abteilungs-Icons; Drag & Drop und Ausblenden funktionieren weiter.
