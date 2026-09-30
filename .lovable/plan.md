# Neue Produkte in TK-Fertiggerichte

## Aktueller Stand (geprüft)
- Kategorie **TK-Fertiggerichte** (unter Tiefkühlprodukte) ist leer.
- Keines der 14 Produkte existiert bereits als Fertiggericht (nur Zutaten wie Lasagneplatten, Paella-Reis, Pad-Thai-Nudeln in anderen Kategorien — diese bleiben unberührt).

## Geplante Änderung (Datenbank, keine Schema-Änderung)

14 Produkte werden in TK-Fertiggerichte angelegt (Einheit „Stück", Menge 1, Katalogsortierung wie in der Tabelle):

1. Beliebiges Tiefkühl-Fertiggericht
2. Lasagne
3. Cannelloni
4. Hähnchen-Sahne-Geschnetzelts
5. Hähnchen-Curry
6. Asia-Nudelpfanne
7. Pad Thai
8. Jambalaya
9. Bami Goreng
10. Nasi Goreng
11. Enchiladas
12. Massaman-Curry
13. Moussaka
14. Paella

Für jedes Produkt:
- Übersetzungen für alle 16 Sprachen (de-DE/AT/CH, en-US/GB/CA, es-ES/MX, fr-FR/CA, it-IT/CH, nl-NL/BE, pt-PT/BR)
- Diät-Ausschlüsse wie bei den übrigen Tiefkühlgerichten: Fleischgerichte (Lasagne, Cannelloni, Enchiladas, Moussaka) schließen vegetarisch/vegan sowie halal/kosher aus; Hähnchen- und Reisgerichte schließen vegetarisch/vegan aus; alles schließt glutenfrei aus. „Beliebiges Tiefkühl-Fertiggericht" folgt dem Muster von „Beliebige Tiefkühlpizza".

## Vorschläge für fehlende, relevante Produkte (Auswahl, mind. 10)

1. Spaghetti Bolognese
2. Chili con Carne
3. Königsberger Klopse mit Reis
4. Köttbullar mit Sauce
5. Schwäbische Maultaschen
6. Kartoffelgratin
7. Gemüse-Lasagne
8. Tikka Masala mit Reis
9. Süß-Sauer-Hähnchen mit Reis
10. Gyoza (Teigtaschen)
11. Frühlingsrollen
12. Ofen-Schupfnudeln mit Kraut? / Gemüse-Reis-Pfanne
13. Cevapcici mit Reis
14. Falafel-Teller

→ Sag Bescheid, welche davon ich zusätzlich anlegen soll (oder „alle").

## Umsetzung
- Einmalige Datenänderung über das Datenbank-Tool (Einfügen der Artikel + Übersetzungen), danach sind die Artikel in der App unter Tiefkühlprodukte → TK-Fertiggerichte sichtbar.
- Keine Änderung am Code; bestehende Listen, Favoriten und Filter bleiben unverändert, die neuen Artikel erscheinen im Diät-Filter automatisch.
