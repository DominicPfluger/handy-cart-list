# Produktvarianten-Link in der Abteilungsansicht

## Ziel
In der Abteilungsansicht erscheint unterhalb der Info-Zeile jedes Produkts (Menge/Packungsgrösse bzw. Suchhinweise wie „auch bekannt als …") ein Link **„Produktvarianten"**, der direkt zur Produktdetailseite führt — dort können eigene Varianten angelegt und verwaltet werden. Der Link ist immer sichtbar, auch bei Produkten ohne Varianten.

## Änderungen

1. **`src/routes/abteilungen.tsx`**
   - In der Produktzeile unterhalb der bestehenden Info-Zeile (`Menge · Preis` bzw. Suchhinweise) einen kleinen Link „Produktvarianten" ergänzen (`text-xs text-primary`), der per `navigate({ to: "/produkt/$id", params: { id: product.id } })` zur Detailseite navigiert.
   - Der bisherige „Details →"-Link am Ende der aufgeklappten Variantenliste wird entfernt (er führt zur selben Seite; der neue Link ersetzt ihn an prominenterer Stelle).
   - Das Auf-/Zuklappen der Variantenliste über den „Varianten (n)"-Button und das Produktbild bleibt unverändert.

2. **i18n (`src/i18n/de.ts` + `messages.json`)**
   - Neuer Text `dept.productVariants` = „Produktvarianten" (de) und Übersetzungen in allen 15 weiteren App-Sprachen.

## Prüfung
- Browser-Test: Produktzeile in der Abteilungsansicht zeigt den Link unter der Mengenzeile; Klick öffnet die Produktdetailseite; Variantenliste lässt sich weiterhin auf-/zuklappen; kein „Details →" mehr am Listenende.
- Ansicht auf Mobil (390 px) und Desktop prüfen; Build fehlerfrei.
