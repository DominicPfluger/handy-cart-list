# Produkt bearbeiten: ESC bricht ab

## Ausgangslage
Im Admin-Panel ist der Bearbeiten-Dialog (Produkt/Kategorie/Überschrift, Komponente `Editor` in `src/routes/_authenticated/admin.tsx`) ein eigenes Overlay — kein Standard-Dialog. Er schliesst bisher nur per Klick daneben oder auf das ✕; die Taste ESC tut nichts.

## Änderung
- ESC schliesst den Dialog gleich wie der Klick daneben: `onClose()` wird aufgerufen, ohne zu speichern.
- Technisch: in `Editor` ein `useEffect` mit `keydown`-Listener (Escape → `p.onClose`), aktiv solange der Dialog offen ist; Listener beim Schliessen/Unmount wieder entfernt.
- Gilt für alle drei Typen (Produkt, Kategorie, Überschrift), da derselbe Dialog verwendet wird. Verhalten entspricht dem bestehenden Klick-daneben — ungespeicherte Eingaben werden verworfen.
- Keine i18n- oder Datenbank-Änderung nötig.

## Prüfung
- Browser-Test: Dialog öffnen, ESC drücken → Dialog schliesst; Speichern und ✕ funktionieren weiterhin wie bisher.
