# Button „Beide Bilder gleich" umbenennen

Im Bild-Bearbeiten-Dialog (Admin-Katalog) heisst der Knopf, der das grosse Vorschaubild als Icon übernimmt, bisher „Beide Bilder gleich". Neu heisst er **„Icon-Bild wie Vorschaubild"**.

## Was geändert wird

Nur der Text des Buttons (Übersetzungsschlüssel `adm.iconUseImage`, verwendet in `src/components/admin/catalog-tile-editor.tsx` Zeile ~881). Die Funktion (Vorschaubild als 64px-Icon übernehmen) bleibt unverändert.

- `src/i18n/de.ts` (Zeile 676): „Beide Bilder gleich" → „Icon-Bild wie Vorschaubild"
- `src/i18n/messages.json`: derselbe Schlüssel in allen 15 weiteren Sprachen:
  - en-US / en-GB / en-CA: „Icon image like preview image"
  - es-ES / es-MX: „Imagen de icono como la vista previa"
  - fr-FR / fr-CA: „Image d'icône comme l'aperçu"
  - it-IT / it-CH: „Immagine icona come anteprima"
  - pt-PT / pt-BR: „Imagem de ícone igual à pré-visualização"
  - nl-NL / nl-BE: „Pictogramafbeelding zoals voorbeeldafbeelding"
  - de-AT / de-CH: „Icon-Bild wie Vorschaubild"

Keine Funktions-, Layout- oder DB-Änderung.

## Prüfung

Typprüfung; JSON-Validierung von messages.json. Optional kurzer Browser-Blick in den Bild-Dialog.
