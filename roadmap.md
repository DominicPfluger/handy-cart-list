# Roadmap

## Offen
- [ ] DB-Security-Hinweise (10 ältere, vorher vorhanden) separat beheben — auf Nutzer-Entscheid wartend
- [ ] Browser-Tests nachholen: recipe-traits-admin, Varianten-Auswahl

## Erledigt (Auswahl)
- [x] Rezepte beim Speichern optional mehreren Länderküchen zuordnen; Suche filtert zuerst nach Länderküchen, Eigenschaften jeweils im eigenen Rahmen (Mobil/Desktop und öffentliches Testrezept mit zwei Küchen geprüft; Testrezepte entfernt).
- [x] Favorisierte Produktvarianten in der passenden Kategorie anzeigen; Schnell-Hinzufügen, Mengen-Dialog und neue Liste erhalten die Variante (Browser-geprüft).
- [x] Marktwahl in „Mehr“ steuert Produkt-Sichtbarkeit, Marktreihenfolge und Marken unabhängig von der Sprache; DE/CH/Automatisch und Marken in der Produktdetailseite im Browser geprüft. Aktuell sind noch keine marktspezifischen Produkte oder Sortierungen hinterlegt.
- [x] Eigene Varianten nur in der Produktdetailansicht anlegen; in der Abteilungsansicht weiterhin verwenden. Anlegen, Dublettenprüfung, Schnell-Hinzufügen und Entfernen auf Handy und Desktop geprüft; Admin-Werkzeuge bleiben getrennt.
- [x] Eigene Produktvarianten pro Gerät speichern, suchen, favorisieren, zur Liste hinzufügen und entfernen (Desktop/Mobil Browser-getestet).
- [x] Abteilungsansicht: „Produktvarianten"-Link ersetzt durch Auf-/Zuklappen-Link „Varianten (n)" unter der Mengenzeile; kleiner Button neben dem Produktnamen entfernt (Desktop/Mobil Browser-getestet).
- „… nach Wahl" auch pro Oberkategorie im Rezept-Generator (Browser-getestet)
- Geschmack: Mehrfachauswahl bis zu 3 (Generator, Suche, Admin; Browser-getestet)
- Admin-Rezeptverwaltung aufklappbar, Zutatensuche, Massen-Zuordnung, „Alle auswählen" in Katalogsuche
- Zutaten-Zuweisung: ausgewählte Einträge auf einmal löschen (Bestätigung; Browser-getestet)
- Aktionsleiste pro Zutatenbereich (Zuweisen/Löschen/Aufheben wirkt nur im Bereich; Browser-getestet)
- Rezept-Eigenschaften (Sättigung, Schärfe, Preisklasse, Geschmack) Pflicht + Suche + Admin
- Varianten-Auswahl im Generator, „nach Wahl" pro Bereich
- Oberkategorien je Rezept-Art, Bereichs-Verwaltung im Admin
- Zutaten-Zuweisung: Alphabetisch-Sortierung je Bereich (lokal, ohne KI/Credits)
- Ernährungsformenfilter im Rezept-Generator entfernt (Knopf + Panel; Zutaten werden dort ungefiltert angezeigt; Länderküchenfilter bleibt)
- Rezept-Generator: Zutaten erscheinen beim Aufklappen direkt neben der grauen Oberkategorie in derselben umbruchenden Reihe (Browser-getestet, Desktop + 390 px, kein horizontales Scrollen).

- [x] Mengenangaben in Rezepten manuell bearbeiten (Generator-Übersicht + Stift-Dialog bei eigenen Rezepten; Browser-getestet)
- [x] Rezept-Admin: „Aus Katalog" neben Suchfeld, KI-Vorschläge (✨) komplett entfernt (Browser-getestet)
- [x] Rezept-Admin: Vorlagen & Zutatenbereiche per Drag & Drop sortierbar, Pfeile entfernt (Browser-getestet)
- Rezept-Admin: Mehrere Oberkategorien gleichzeitig per Zeilenumbruch anlegen; Bereich „Rezept-Kategorien" in „Zutaten-Kategorien" umbenannt (16 Sprachen); Browser-getestet
- Listen-Verwaltung: Vorlagen per Drag & Drop sortierbar (Zieh-Griff wie bei Listen), Löschen-Knopf bleibt
- Admin „Mehrere Produkte": Positions-Auswahl (Ende/oben/unter Überschrift) bei Abteilungen mit Überschriften
- Rezepte-Admin: Bearbeiten/Löschen als Stift-/Papierkorb-Icons direkt neben dem Drag-Griff (Vorlagen & Oberkategorien).
- Abteilungsansicht: Produktvarianten mit Herz (Favorit), Blitz (Schnell hinzufügen) und grünem Plus (Produkt-hinzufügen-Dialog, Variante vorgewählt).

- [x] Rezepte-Admin: Bereich „Vorlagen & Oberkategorien" → „Vorlagen", Button „Neue Oberkategorie" → „Neue Vorlage" (16 Sprachen)

- [x] Admin-Katalog: Produktzeilen mit Zieh-Griff (⠿ neben Bild), Stift (Bearbeiten-Dialog) und Papierkorb (Löschen mit Bestätigung) ergänzt

- Admin-Katalog: Varianten-Schnelldialog (Tags-Icon pro Produktzeile, mehrzeilig, dedupe, translateVariants)
- [x] Admin-Tab „Rezept-Generator“ → „Rezept-Verwaltung“ (adm.tab.recipes in de.ts + 15 Lokalen)
- [x] Zutaten-Kategorien im Rezepte-Admin standardmässig aufgeklappt (recipe-admin.tsx groupsOpen=true)
- [x] Admin-Katalog: „Als Textdatei exportieren" durch „Liste als Text kopieren" ersetzt (Dialog mit Titel, Vorschau-Textarea, Clipboard-Kopieren)
- [x] Admin: Länderküchen-Tab standardmässig aufgeklappt (Browser-Test: offen sichtbar, Zuklappen/Aufklappen ok)
- [x] Admin-Tab „Rezept-Generator" → „Rezept-Verwaltung" in allen 16 Sprachen (Browser-Test: „Recipe Management")
- [x] Rezepte-Admin: Zutaten-Kategorien standardmässig aufgeklappt (Browser-Test: Cereal-Vorlage zeigt 5 Kategorien offen)
- [x] Browser-Auth-Fix für Tests: Session-JSON muss doppelt kodiert in localStorage geschrieben werden

- [x] Admin-Tabs: Märkte direkt neben Sprachen eingeordnet

- [x] Admin-Katalog: Schnell-KI-Bild-Knopf (✨) pro Produktzeile mit Credits-Bestätigung, Ladezustand, Icon-Komprimierung
- Mengeneinheit „Artikel" (Art.) hinzugefügt: Enum-Wert in der Datenbank, Einheitenliste und Übersetzungen in allen 16 Sprachen.

- [x] Rezepte-Admin: Zutaten-Kategorien in eigenem umrandeten Container (rounded-lg border bg-background p-2) statt nur Trennlinie; getestet im Browser.
- [x] Rezepte-Admin: Button „Neue Vorlage" umbenannt in „Neue Rezept-Kategorie" (adm.stepNew) in allen 16 Sprachen; Tab-Name unverändert.
- [x] Separates Icon + grosses Vorschaubild für Produkte und Kategorien

- [x] Admin: Stift neben Zieh-Griff (Papierkorb bleibt rechts) + Icon-Funktionen im Bild-Dialog (Beide Bilder gleich, Bild auswählen, KI-Bild, Entfernen) — Browser-getestet: Zeile ⠿/Stift/Bild/…/Papierkorb, Dialog zeigt alle vier Aktionen, „Beide Bilder gleich" übernimmt das Vorschaubild als Icon, Entfernen setzt zurück auf Auto-Icon
- [x] Admin-Produktliste: Stift zurück nach rechts (vor Varianten-Knopf); Ziehen per langem Drücken (~0,5 s) aufs Produktbild zusätzlich zum ⠿-Griff; kurzes Tippen öffnet weiterhin den Bild-Dialog (2026-10-03)
- [x] Admin: KI-Bild-Optionen im Bild-Dialog (Stichworte, Stil, Hintergrund, Ansicht, Anzahl) — erledigt 2026-10-03

- [x] Abteilungsansicht: kein grosses Vorschaubild mehr über der aufgeklappten Variantenliste (2026-10-03)
- [x] Icon-Bild wie Vorschaubild repariert
- [x] KI-Bilder beim Anlegen neuer Produkte
- [x] Produkt-Bilddialog vollständig scrollbar; eigene KI-Stichworte und Optionen für das kleine Icon, unabhängig vom grossen Vorschaubild (Desktop und Mobilgerät geprüft; KI-Icon-Erzeugung geprüft).
- [x] Abteilungsansicht: Kategorienbild über der Produkteauflistung für jede Kategorie mit Bild (nicht mehr nur bei Icon+Bild; Frühstücks-Cerealien unverändert; Desktop/Mobil Browser-getestet) — erledigt 2026-10-03
- [x] Favoritenansicht: Produkt-Icons (kleine Bilder) statt nur Emoji; Einstellung Bilder/Symbole wird respektiert (Handy/Desktop Browser-getestet) — erledigt 2026-10-03

- [x] 2026-10-03 Abteilungsansicht: Produktbild und -name oeffnen immer die Detailseite; Varianten klappen nur ueber den „Varianten (n)"-Link auf; Umbenennen fuer Admins per Stift-Icon neben dem Namen.
- [x] Admin-Produktauflistung zeigt pro Produkt das kleine Icon statt des grossen Vorschaubilds (Fallback: Vorschaubild, dann Emoji); Doppelklick-Zoom bleibt beim grossen Bild (Browser-Test Zwiebeln & Lauchgemüse).
