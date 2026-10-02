# Umsetzungsplan: 6 priorisierte Verbesserungen

Die per Checkbox gewählten Funktionen, in sinnvoller Reihenfolge.

## 1. Schneller erfassen & abhaken (Einkaufen)

- **Schnell-Chips im Suchfeld**: Beim Tippen in der Listen-Suche erscheinen die zuletzt/häufigst gekauften Produkte als Chips — ein Tipp fügt sie hinzu. Basis: vorhandene lokale Kauf-Historie.
- **Mengen-Schnelltasten**: +/− direkt am Listeneintrag, ohne den Eintrag zu öffnen.
- **Einkaufs-Modus**: Grossschrift-Ansicht zum Abhaken — nur Häkchen, keine Bearbeitungs-Knöpfe; Bildschirm bleibt wach (Wake Lock).

## 2. Foto pro Listeneintrag

- Kamera-/Bild-Knopf am Listeneintrag; Foto wird komprimiert (max. ca. 200 KB, WebP) und **nur lokal auf dem Gerät** gespeichert (IndexedDB) — kein Cloud-Upload.
- Foto erscheint klein am Eintrag, per Tipp gross; Zuordnung über die lokale Eintrags-ID.
- Geteilte Listen: Foto bleibt gerätelokal, andere Mitglieder sehen nur den Texteintrag.
- Keine Datenbank- oder Storage-Änderung nötig.

## 3. Portionen-Rechner (Rezepte)

- Auf der Rezept-Seite: Auswahl 1–8 Portionen (Standard 4).
- Zutaten-Mengen skalieren proportional; beim Übernehmen auf die Einkaufsliste gelten die skalierten Mengen.
- Erkennung der Mengen aus den vorhandenen Mengen-/Einheiten-Feldern der Rezept-Zutaten; Zutaten ohne Menge bleiben unverändert.

## 4. Katalog-Gesundheit (Admin)

- Neuer Abschnitt im Admin unter „Mehr": Zähler für Produkte ohne Bild, ohne Preis (im gewählten Markt), ohne Übersetzung, ohne Ernährungs-/Küchen-Zuordnung.
- Jede Zeile ist anklickbar und öffnet die gefilterte Katalog-Ansicht, damit die Lücken direkt geschlossen werden können.
- Dubletten-Hinweis: Produkte mit identischem Namen in derselben Kategorie werden aufgelistet.

## 5. Schnellerer Start

- Katalog wird in Häppchen geladen: zuerst Kategorien + Produkte der obersten Ebene, Rest im Hintergrund.
- Lange Ladezeit beim ersten Admin-Katalog-Abruf (ca. 35 s) wird durch Nachladen pro geöffneter Kategorie verkürzt.
- Ziel: App reagiert spürbar früher; bestehender Bilder-Cache bleibt unverändert.

## 6. Schriftgrösse einstellbar

- Unter „Mehr": Auswahl Klein / Normal / Gross (gerätelokal gespeichert).
- Umsetzung über einen Skalierungsfaktor auf der Wurzel-Schriftgrösse, damit alle Texte mitwachsen.

## Beschriftungen

Alle neuen Texte in Deutsch und den 15 weiteren App-Sprachen.

## Technische Hinweise

- Foto pro Eintrag: IndexedDB (gerätelokal), komprimiertes WebP; Schlüssel = Listen-/Eintrags-ID, automatisches Aufräumen gelöschter Einträge.
- Einkaufs-Modus: `navigator.wakeLock` (mit Fallback ohne), Umschalter in der Listen-Ansicht.
- Portionen-Rechner: reine Client-Logik auf `recipes.items` (jsonb), keine Schema-Änderung.
- Katalog-Gesundheit: Abfragen über bestehende Tabellen (`products`, `product_reference_prices`, `catalog_translations`), serverseitig aggregiert.
- Schnellerer Start: Katalog-Query in `catalogQueryOptions` aufteilen (Kategorien zuerst, Produkte pro Kategorie nachladen); Achtung: `ssr: false` und Cache-Verhalten beibehalten.
- Schriftgrösse: `font-size` auf `html` via Klasse/Style-Property, Wert in localStorage (`shoppi:font-size`).

## Reihenfolge der Umsetzung

1. Schriftgrösse (klein, unabhängig)
2. Schneller erfassen & abhaken
3. Foto pro Eintrag (mit Migration)
4. Portionen-Rechner
5. Katalog-Gesundheit
6. Schnellerer Start (grösster Eingriff, zum Schluss)
