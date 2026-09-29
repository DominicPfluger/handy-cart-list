# Fisch-Kategorie erweitern

## Ausgangslage
Die Kategorie **Fisch** enthält bereits **Lachsfilet** und **Thunfisch** — diese beiden werden nicht doppelt angelegt. Die übrigen 19 gewünschten Fische kommen hinzu, nach Relevanz und Ähnlichkeit sortiert.

## Neue Einträge (19, in dieser Reihenfolge)

1. **Edelfische / beliebt:** Wolfsbarsch, Doradenfilet, Forelle, Saibling, Felchen
2. **Raubfische:** Eglifilet, Zander, Hecht
3. **Weissfische:** Kabeljau, Rotbarsch, Seeteufel
4. **Plattfische:** Seezunge, Steinbutt, Heilbutt
5. **Grössere Fische:** Schwertfisch, Makrelen
6. **Kleinfische:** Sardinen, Sardellen, Hering

## Umsetzung
- 19 neue Artikel in der Kategorie Fisch, jeweils 1 Stück
- Ernährungsform-Klassifikation: nicht vegetarisch/vegan; Sardellen, Hering etc. zudem markiert wo sinnvoll
- Übersetzungen in 6 Sprachen (EN, ES, FR, IT, NL, PT) — regionale Varianten fallen automatisch darauf zurück

## Vorschläge für fehlende relevante Einträge (nach Freigabe)
- **Beliebt:** Pangasiusfilet, Seelachsfilet, Tilapia, Garnele-/Scampi-Verweis existiert ggf. in anderer Kategorie
- **Geräuchert & mariniert:** Räucherlachs, Graved Lachs, Räucherforelle, Matjes, Rollmops, Anchovis in Öl
- **Spezial:** Oktopus, Tintenfisch, Jakobsmuscheln, Hummer, Krabben, Gambas
- **Fischstäbchen & Fertigware:** ggf. eigene Kategorie oder Tiefkühl-Fisch

## Technisch
- Tabelle `products` (department_id Fisch), sort_order ab 3, IDs im a1b2c3d4-29xx-Schema
- Tabelle `catalog_translations` mit is_manual=true, keine de-DE-Zeilen (deutscher Name steht in products.name)
