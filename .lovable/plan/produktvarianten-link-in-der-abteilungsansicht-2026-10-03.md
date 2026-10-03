# Produktvarianten-Link in der Abteilungsansicht

## Ziel
In der Abteilungsansicht erscheint unterhalb der Info-Zeile jedes Produkts mit Varianten (Menge/Packungsgrösse bzw. Suchhinweise wie „auch bekannt als …") ein Link **„Produktvarianten"**, der direkt zur Produktdetailseite führt — dort können eigene Varianten angelegt und verwaltet werden. Produkte ohne Varianten zeigen keinen Link.

## Änderungen

1. **`src/routes/abteilungen.tsx`**
   - In der Produktzeile unterhalb der bestehenden Info-Zeile (`Menge · Preis` bzw. Suchhinweise) einen kleinen Link „Produktvarianten" ergänzen (`text-xs text-primary`), aber nur wenn `product.variants.length > 0`; Klick navigiert per `navigate({ to: "/produkt/$id", params: { id: product.id } })` zur Detailseite.
   - Der bisherige „Details →"-Link am Ende der aufgeklappten Variantenliste wird entfernt.
   - Das Auf-/Zuklappen der Variantenliste über den „Varianten (n)"-Button und das Produktbild bleibt unverändert.

2. **i18n (`src/i18n/de.ts` + `messages.json`)**
   - Neuer Text `dept.productVariants` = „Produktvarianten" (de) und Übersetzungen in allen 15 weiteren App-Sprachen.

## Prüfung
- Browser-Test: Produktzeile in der Abteilungsansicht zeigt den Link nur bei Produkten mit Varianten unter der Mengenzeile; Klick öffnet die Produktdetailseite; Variantenliste lässt sich weiterhin auf-/zuklappen; kein „Details →" mehr am Listenende.
- Ansicht auf Mobil (390 px) und Desktop prüfen; Build fehlerfrei.
