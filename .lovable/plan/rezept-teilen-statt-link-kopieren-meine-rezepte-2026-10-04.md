# Rezept teilen statt Link kopieren (Meine Rezepte)

## Ausgangslage
In der Rezeptliste „Meine Rezepte" (`src/components/saved-recipes-board.tsx`, `Row`) steht heute ein 🔗-Button. Er veröffentlicht das Rezept und ruft `shareLink()` auf — das öffnet den nativen Systemdialog oder kopiert sonst den Link in die Zwischenablage (Toast „Link kopiert"). Genau dieses „Link kopieren" soll weg.

An anderen Stellen der App (z. B. Listen-Teilen in `list-manager.tsx` / `index.tsx`) wird bereits der gemeinsame Teilen-Dialog `openShareSheet()` aus `src/components/share-sheet.tsx` verwendet — mit WhatsApp, Telegram, SMS, E-Mail usw. sowie einem „Text kopieren"-Button im Dialog.

## Änderungen

Nur in `src/components/saved-recipes-board.tsx`:

1. **Teilen-Aktion ersetzen:** Statt `publishRecipe()` + `shareLink()` ruft der Button auf:
   ```ts
   const slug = await publishRecipe(r.recipeId); // liefert Slug (Rezept bleibt unveröffentlicht, wenn bereits public)
   openShareSheet({ title: r.title, text: `🍽️ ${r.title}\n${shareUrl(slug)}` });
   ```
   `shareUrl()` kommt aus `../lib/recipes-api`. Der ShareSheet-Text enthält damit Rezeptname und Link; die Empfänger öffnen das Rezept direkt.
2. **Symbol tauschen:** Der 🔗-Emoji-Button erhält dasselbe `ShareIcon` (aus `./icons`, importieren), das auch der Listen-Teilen-Button nutzt — gleiche Position (zwischen Stift und Papierkorb), aria-label/title bleibt `t("rs.share")`.
3. **Aufräumen:** `shareLink` wird in der Datei nicht mehr gebraucht → Import entfernen. `toast`/`rs.linkCopied` entfallen für diesen Pfad (Fehlerfall bleibt mit `t("cloud.error")`).

## Nicht geändert
- Rezept-Detailseite (`rezept.$slug.tsx`) und Community-Bereich (`community-section.tsx`) behalten ihr bisheriges Verhalten — die Anfrage betrifft die Rezeptlisten („Meine Rezepte").
- Keine neuen Übersetzungsschlüssel nötig (`rs.share` existiert bereits).

## Prüfung
- Typprüfung `bunx tsgo --noEmit`.
- Browser-Check: Rezeptliste öffnen, auf das Teilen-Symbol tippen → ShareSheet erscheint mit Rezeptname und Link; „Text kopieren" kopiert den Text.
