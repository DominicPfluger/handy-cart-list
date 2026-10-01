# Rezept-Beschreibungsfeld und Titel im Rezept-Generator

## Ziel
Geteilte Rezepte bestehen nicht mehr nur aus Zutaten: Beim Speichern gibt man im Rezept-Generator einen eigenen Titel und eine Beschreibung ein. Titel und Beschreibung erscheinen überall dort, wo Rezepte angezeigt werden (Ranglisten, Community-Rezepte, geteilte Rezeptseite).

## Aktueller Stand (geprüft)
- Die Tabelle `recipes` hat eine Spalte `title`, aber keine Beschreibung.
- Der Generator baut heute automatisch einen Titel („Kategorie: Zutat 1, Zutat 2 …"); im Speichern-Fenster kann man ihn überschreiben. Ein eigenes Titel-Feld und eine Beschreibung fehlen.

## Umsetzung

### 1. Datenbank
- Migration: Spalte `description text` in `recipes` ergänzen (leer = keine Beschreibung). Keine neuen Zugriffsregeln nötig — bestehende gelten weiter.

### 2. Speichern-Fenster im Rezept-Generator
- Feld „Titel" (bereits ausgefüllt mit dem automatisch vorgeschlagenen Titel, frei änderbar).
- Feld „Beschreibung" (mehrzeilig, z. B. Zubereitung, Tipps, Anlass).
- Beides wird beim Speichern (privat oder öffentlich) und beim direkten Teilen mitgeschickt.

### 3. Anzeige der Beschreibung
- **Ranglisten-Karten** (Am besten bewertet, Am häufigsten gespeichert, Neue Kreationen): Beschreibung als gekürzter Zweizeiler unter dem Titel.
- **Community-Rezepte**: Beschreibung unter dem Titel in der Liste und bei „Meine geteilten".
- **Geteilte Rezeptseite** (Link): Beschreibung als Absatz unter dem Titel; sie wird auch als Seitenbeschreibung für Vorschau-Links (WhatsApp & Co.) verwendet.
- Beschreibungen erscheinen nur, wenn eine eingegeben wurde — alte Rezepte bleiben unverändert.

### 4. Übersetzungen
- Neue Begriffe (Titel, Beschreibung, Platzhalter) in alle 16 Sprachen übersetzen.

## Prüfumfang
- Rezept mit Titel + Beschreibung speichern, in Rangliste, Community und auf der geteilten Seite sehen.
- Rezept ohne Beschreibung speichern — Anzeige wie bisher ohne Lücke.
