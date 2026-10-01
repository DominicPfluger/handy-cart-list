# Plan: Marktspezifische Sortierung im Admin-Panel

## Ziel
Im Admin-Panel lassen sich Produkte nach der Relevanz für einen bestimmten Markt sortieren — und diese Reihenfolge pro Markt speichern.

## Was bereits vorhanden ist
- Die Tabelle `product_market_order` speichert pro Produkt und Markt eine Position (sort_order) — sie wird bisher im Admin-Panel noch nicht genutzt.
- Im Admin-Panel gibt es bereits eine Sortier-Auswahl (Beliebtheit, Alphabetisch, Ähnlichkeit), die die globale Reihenfolge speichert.
- Markt-Admins existieren bereits: Sie dürfen nur Produkte ihres Markts bearbeiten.

## Umsetzung

### 1. Neuer Sortier-Modus „Markt-Relevanz"
- In der Sortier-Auswahl im Admin-Panel erscheint zusätzlich die Option „Markt-Relevanz".
- Daneben erscheint eine Markt-Auswahl (z. B. Schweiz, Deutschland, Österreich …). Voreingestellt ist der Markt der eigenen Sprachvariante; Markt-Admins sehen nur ihren eigenen Markt.
- In diesem Modus werden die Produkte einer Kategorie nach der gespeicherten Markt-Reihenfolge angezeigt. Produkte ohne Markt-Eintrag stehen am Ende, in ihrer globalen Reihenfolge.

### 2. Reihenfolge pro Markt speichern
- Per Drag & Drop (wie bisher) lässt sich die Reihenfolge im Markt-Modus ändern.
- Beim Speichern wird die Reihenfolge in `product_market_order` für den gewählten Markt geschrieben — die globale Sortierung bleibt unberührt.
- Produkte, die im Markt nicht verfügbar sind (Markt-Ausschluss), werden ausgegraut und ans Ende gestellt.

### 3. Rechte
- Super-Admins dürfen für jeden Markt sortieren.
- Markt-Admins dürfen nur die Reihenfolge ihres eigenen Markts ändern (Prüfung über die bestehende Markt-Admin-Regel in der Datenbank).

### 4. Wirkung in der Abteilungsansicht
- Die gespeicherte Markt-Reihenfolge gilt automatisch auch in der normalen Abteilungsansicht für Nutzer dieses Markts (baut auf der bereits umgesetzten Markt-Sortierung auf).

## Technische Details
- `src/routes/_authenticated/admin.tsx`: neuer Sortier-Modus + Markt-Auswahl; Speichern schreibt in `product_market_order` (upsert pro Produkt/Markt) statt in `products.sort_order`.
- Bestehende RLS-Regeln auf `product_market_order` prüfen Markt-Admin-Rechte bereits; falls eine Schreib-Regel fehlt, wird sie per Migration ergänzt.
- Texte in `src/i18n/de.ts` und `messages.json` (alle 16 Sprachen).

## Offene Punkte
- Keine — baut vollständig auf vorhandenen Strukturen auf.
