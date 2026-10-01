# Alias-Kategorien im Katalog

## Ziel
Eine Kategorie (z. B. „Milchgetränke") hat weiterhin genau einen festen Platz („Milchprodukte & Eier"), kann aber zusätzlich als Verknüpfung in weiteren Oberkategorien erscheinen (z. B. „Kaffee & Milchgetränke"). Produkte gibt es nur einmal; Änderungen gelten überall.

## Was du bekommst

**Abteilungsansicht**
- Die Alias-Kategorie erscheint in der zusätzlichen Oberkategorie als normale Kachel (gleiches Bild, Name, Emoji) – ohne zusätzliches Symbol, nicht vom Original unterscheidbar.
- Antippen öffnet dieselbe Kategorie mit denselben Produkten und Unterkategorien.
- Filter (Ernährungsform, Länderküche) und lokales Ausblenden wirken wie beim Original. Leere Aliase werden ausgeblendet.
- Suche zeigt Produkte nicht doppelt.

**Admin-Panel**
- Im Kategorie-Editor neuer Bereich „Auch anzeigen unter…": eine oder mehrere weitere Oberkategorien auswählen, entfernen.
- In der Kategorienliste erscheinen Aliase an ihrer Zusatzposition (dezent als „Alias" beschriftet, ohne Symbol); per ▲▼ / Drag & Drop sortierbar und per Klick entfernbar (das Original bleibt).
- Löschen des Originals entfernt automatisch alle Aliase.
- Schutz: eine Kategorie kann nicht als Alias in sich selbst oder in einer eigenen Unterkategorie liegen.

## Technische Details
- Neue Tabelle `department_aliases` (id, department_id → departments on delete cascade, parent_id → departments on delete cascade, sort_order, Zeitstempel; unique(department_id, parent_id)). Grants anon/authenticated SELECT, authenticated schreiben, service_role ALL; RLS: öffentlich lesbar, Schreiben nur `has_role(auth.uid(),'admin')`.
- `getCatalog` lädt Aliase; `Catalog.departmentAliases`. `childrenOf` liefert zusätzlich Alias-Einträge (Original-Department mit `aliasOf`/Alias-sortOrder), Navigation nutzt die Original-ID.
- Breadcrumb beim Öffnen über Alias zeigt den Pfad über die Alias-Oberkategorie (Herkunft als Navigationsparameter).
- Admin: Alias-Verwaltung in `admin.tsx` (Kategorie-Editor + Listenanzeige), Zyklus-Prüfung clientseitig.
- Neue i18n-Keys in `de.ts` und allen 15 Locales.
- AGENTS.md-Regel für Aliase ergänzen.
