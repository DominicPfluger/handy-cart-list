# Wurstwaren-Katalog erweitern

## Ziel
Unter «Wurstwaren» die 16 genannten Unterkategorien in deiner Reihenfolge anlegen und alle aufgeführten Artikel in der jeweils genannten Reihenfolge anzeigen. Schreibweisen und unterschiedliche Spezialitäten bleiben erhalten. Der vorhandene allgemeine Eintrag «Schinken» bleibt bestehen, da er in der Liste nicht neu eingeordnet ist.

## Was sich ändert
- «Salami», «Speck & Bacon», «Kochschinken», «Rohschinken & Luftgetrocknetes», «Brühwürste», «Rohwürste», «Bratwürste», «Kochwürste», «Pasteten & Terrinen», «Streichwürste & Aufstriche», «Geflügelaufschnitt», «Geräuchertes & Gepökeltes», «Wildspezialitäten», «Snacks», «Platten & Mischungen» und «Vegane & Vegetarische Fleischalternativen» erscheinen als Unterkategorien.
- Jeder Artikel wird genau einmal als Produkt gespeichert. Bei weiteren Nennungen erscheint dasselbe Produkt über einen Produkt-Alias in der zusätzlichen Unterkategorie. Auch bereits im Katalog vorhandene gleichnamige Produkte werden wiederverwendet, nicht verdoppelt.
- Die bestehende «Salami» wird in die neue gleichnamige Unterkategorie eingeordnet; sonstige bestehende Wurstwaren bleiben erhalten. Bereits anderweitig eingeordnete Artikel wie «Leberpastete» und «Hirschsalami» werden in den gewünschten Unterkategorien zusätzlich als Alias sichtbar.
- Neue Kategorien und Produkte erhalten Namen in allen 16 unterstützten Sprachvarianten, mit landesüblichen Produktbezeichnungen. Kategorienamen und übrige Funktionstexte bleiben für de-CH Schweizer Standarddeutsch, ohne Mundart.

## Technische Umsetzung
- Eine Datenmigration legt die Unterkategorien und fehlenden Produkte mit ihrer Sortierung an, verknüpft identische Produktnamen über `product_aliases` und lässt vorhandene Artikel sowie manuell gepflegte Übersetzungen unverändert. Sie prüft anhand von Namen und Elternkategorie auf bestehende Einträge, um Duplikate zu vermeiden. Nur exakt identische Namen werden zusammengeführt; ähnliche, aber verschiedene Wurstsorten bleiben eigenständige Produkte.
- Für neue Katalognamen werden Übersetzungen in `catalog_translations` ergänzt. Regionale Spezialitäten und Eigennamen bleiben sinnvoll erhalten; fehlende Übersetzungen werden vor Abschluss kontrolliert und ergänzt.
- In der App die Kategoriehierarchie, die Reihenfolge, die Anzahl der Produkte und wiederholte Artikel in beiden betreffenden Unterkategorien prüfen; bestehende Produkte dürfen durch die Ergänzung nicht verschwinden.
