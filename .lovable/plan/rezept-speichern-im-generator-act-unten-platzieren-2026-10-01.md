# Rezept speichern im Generator-Act unten platzieren

## Aktuell (src/components/recipe-builder.tsx)

- Der grosse grüne „Rezept speichern“-Button (bg-primary, weisse Schrift) steht **oben** im Generator, direkt unter der Reihe mit Ernährungsform-/Favoriten-/Überrasche-mich-Buttons (Zeilen 453–460).
- Im „Dein Rezept“-Kasten unten stehen: zuerst „X Zutaten zur Liste“ (rk.addAll), darunter ein kleiner umrandeter Speichern-Button nebem dem Teilen-Button (Zeilen 534–556).

## Änderung

1. **Oberen grossen Speichern-Button entfernen** (Zeilen 453–460).
2. **Im „Dein Rezept“-Kasten die Reihenfolge tauschen:**
   - Ganz oben: der grosse grüne „Rezept speichern“-Button (gleiches Aussehen wie bisher oben: `rounded-2xl bg-primary py-4 text-lg font-bold`), nur wenn der Nutzer angemeldet ist.
   - Darunter: „X Zutaten zur Liste“ (rk.addAll, unverändert).
   - Darunter: der Teilen-Button (🔗, bleibt bestehen). Der bisherige kleine Speichern-Button entfällt, weil der grosse ihn ersetzt.
3. Für nicht angemeldete Nutzer bleibt der Hinweis „Anmelden zum Speichern“ an gleicher Stelle (unter „Zutaten zu Liste“).
4. Keine Text-/Übersetzungsänderungen nötig — alle Schlüssel (rk.save, rk.saved, rk.addAll, rs.share, rs.signInToSave) existieren bereits in allen 16 Sprachen.

## Prüfung

- Build-Log prüfen (build OK).
- Vorschau (Playwright): Generator öffnen, Zutaten wählen — unten im „Dein Rezept“-Kasten steht „Rezept speichern“ (grün) zuerst, darunter „Zutaten zur Liste“, dann Teilen; oben ist kein Speichern-Button mehr.
