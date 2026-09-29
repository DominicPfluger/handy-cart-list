# Tees-Kategorie unter Getränke anlegen

## Ausgangslage
Unter **Getränke** existiert bereits die Kategorie **Kaffee & Tee** (flach, ohne Unterkategorien). Die neue Kategorie **Tees** wird wie gewünscht direkt unter **Getränke** angelegt — als eigenständige Schwester-Kategorie. Den Tippfehler „Beliebiger Fürchtete" korrigiere ich zu **Beliebiger Früchtetee**.

## Struktur: Tees mit 9 Unterkategorien, 84 Artikeln

1. **Schwarztee** (8): Earl Grey, English Breakfast, Assam, Darjeeling, Ceylon, Keemun, Lapsang Souchong, Chai Schwarztee
2. **Grüntee** (8): Sencha, Matcha, Gunpowder, Jasmin-Grüntee, Genmaicha, Bancha, Gyokuro, Longjing
3. **Weisser Tee** (4): Pai Mu Tan, Silver Needle, White Peony, Jasmin-Weißtee
4. **Oolong-Tee** (4): Tie Guan Yin, Da Hong Pao, Milch-Oolong, Formosa Oolong
5. **Kräutertees** (13): Beliebiger Kräutertee, Pfefferminztee, Kamillentee, Fencheltee, Salbeitee, Melissentee, Brennnesseltee, Ingwertee, Zitronengrastee, Thymiantee, Lindenblütentee, Lavendeltee, Rosmarintee
6. **Früchtetees** (15): Beliebiger Früchtetee, Hagebuttentee, Hibiskustee, Apfeltee, Beerenfrüchtetee, Waldbeerentee, Himbeertee, Erdbeertee, Kirschtee, Pfirsichtee, Mango-Tee, Maracuja-Tee, Orangen-Tee, Zitronentee, Apfel-Zimt-Tee
7. **Rooibos & Honeybush** (6): Rooibos Natur, Vanille-Rooibos, Orange-Rooibos, Karamell-Rooibos, Chai-Rooibos, Honeybush-Tee
8. **Gewürz- & Spezialtees** (9): Masala Chai, Ingwer-Zitrone-Tee, Kurkuma-Tee, Zimt-Tee, Ingwer-Kurkuma-Tee, Mate-Tee, Pu-Erh-Tee, Tulsi-Tee, Ginseng-Tee
9. **Teemischungen** (12): Kräuter-Tee-Mischung, Schlaf- und Abendtee, Entspannungstee, Magen-Darm-Tee, Erkältungstee, Detox-Tee, Energie-Tee, Wintertee, Weihnachtstee, Sommer-Früchtetee, Zitronen-Ingwer-Tee, Minze-Limette-Tee

## Umsetzung
- Kategorie **Tees** (Emoji 🍵) als letzte Unterkategorie von Getränke, darunter die 9 Unterkategorien in der angegebenen Reihenfolge
- 84 Artikel, jeweils 1 Packung; Einheiten sinnvoll (Matcha 1 Dose)
- Ernährungsform: Kräuter-/Früchte-/Rooibos-Tees für alle Formen geeignet; Schwarz-/Grün-/Oolong-Tees enthalten Koffein (keine Ausschlüsse nötig, da keine passende Ernährungsform existiert); aromatisierte Tees (Vanille, Karamell etc.) fallen bei Zuckerfrei/Keto/Low-Carb weg, falls aromatisiert — hier konservativ: keine Ausschlüsse ausser bei süss aromatisierten Sorten
- Übersetzungen aller Kategorien und Artikel in 6 Sprachen (EN, ES, FR, IT, NL, PT); regionale Varianten fallen automatisch darauf zurück

## Hinweis
Mögliche Überschneidung mit der bestehenden Kategorie **Kaffee & Tee**: Falls gewünscht, kann diese später in **Kaffee** umbenannt oder die Tee-Artikel daraus nach Tees verschoben werden — nicht Teil dieses Plans.

## Technisch
- Tabelle `departments` (parent_id = Getränke bzw. Tees), Tabelle `products`, Tabelle `catalog_translations` mit is_manual=true
- IDs im a1b2c3d4-29xx-Schema, keine de-DE-Übersetzungszeilen (deutscher Name in departments.name / products.name)
