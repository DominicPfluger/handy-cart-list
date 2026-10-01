## nl-BE im Bearbeiten-Fenster sichtbar machen

**Befund:** nl-BE ist in der App und in der Datenbank vorhanden (3707 Übersetzungen, gleich viele wie nl-NL). Im Produkt/Kategorie-Bearbeiten-Fenster ist nl-BE die letzte Sprachzeile. Die untere Menüleiste der App liegt auf derselben Ebene über dem Fenster und verdeckt diese letzte Zeile auf dem Handy.

**Änderung:**
- Bearbeiten-Fenster im Admin-Panel über die Menüleiste legen, damit es bis ganz unten scrollbar und lesbar ist.
- Unten etwas mehr Abstand, damit die letzte Zeile (nl-BE) sicher frei bleibt.

**Prüfung:** Fenster in der Handy-Ansicht öffnen, ganz nach unten scrollen und kontrollieren, dass 🇧🇪 nl-BE sichtbar und bearbeitbar ist.

### Technisch
- `src/routes/_authenticated/admin.tsx` Zeile 727: Overlay `z-50` → `z-[60]` (Nav in `__root.tsx` ist `z-50` und kommt später im DOM).
- Zeile 728: unteres Padding auf `calc(5rem+env(safe-area-inset-bottom))` erhöhen.
