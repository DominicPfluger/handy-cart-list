# Link-Icon im Listen-Manager entfernen

## Ziel
Im Listen-Manager (die Leiste pro Liste, wo man die Liste umbenennen/auswählen kann) verschwindet das Ketten-Link-Icon (Einladungslink) — bei angemeldeten Nutzern — sowie das Teilen-Icon, das dort für nicht angemeldete Nutzer erscheint. Der Teilen-Button beim Listentitel in der Listenansicht bleibt unverändert.

## Änderungen

1. **`src/components/list-manager.tsx`**
   - In der `Row`-Komponente den Button-Block entfernen, der das Ketten-Link-Icon (`onShareInvite`) bzw. für nicht angemeldete Nutzer das Teilen-Icon (`shareList`) zeigt (Zeilen 151–170).
   - Entstandene toten Code entfernen: Row-Props `signedIn`, `inviteLink`, `onShareInvite`; `copyInvite` und `shareInviteLink` (nur dafür genutzt); Prop `inviteLinkFor` in `ListManagerProps` sowie `signedIn` in `ListManagerProps`, falls danach unbenutzt.
   - Import `ShareIcon` entfernen, falls unbenutzt.

2. **`src/routes/index.tsx`**
   - Die Prop `inviteLinkFor` nicht mehr an `ListManager` übergeben und aus der Dekonstruktion entfernen (Zeilen 51, 197).
   - Teilen-Button beim Listentitel (Zeilen 227–233) bleibt unverändert.

3. **Nicht ändern**
   - Sonstige Einladungs-/Teilen-Einstiege (Favoritenansicht, „Einkauf abschliessen" etc.) bleiben unverändert.

## Verifikation
- Build fehlerfrei.
- Playwright-Check: Listen-Manager öffnet, Listenzeile zeigt Umbenennen/Vorlage/Löschen ohne Ketten-Link-Icon; Teilen-Icon beim Listentitel noch vorhanden.
