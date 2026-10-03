# Varianten-Link mit Anzahl unterhalb der Mengen-/Preisangabe

## Ziel
In der Abteilungsansicht (Produktzeile) erscheint unterhalb der Mengen- und Preisangabe ein einzelner Link **„Varianten (n)“**, der die Variantenliste des Produkts auf- und zuklappt. Der Text-Link „Produktvarianten“ (der zur Detailseite führte) und der kleine Auf-/Zuklappen-Button „Varianten (n) ▾“ neben dem Produktnamen verschwinden.

## Änderungen

**`src/routes/abteilungen.tsx`**
1. Kleinen „Varianten (n) ▴/▾“-Button neben dem Produktnamen entfernen (derzeit nach dem Produktnamen-Button).
2. Den Link „Produktvarianten“ unterhalb der Mengen-/Preiszeile entfernen und an derselben Stelle den neuen Auf-/Zuklappen-Link einfügen: Text `t("dept.variants", { count: product.variants.length })` mit ▴/▾-Pfeil je nach Zustand, nur sichtbar wenn `product.variants.length > 0`, Klick ruft `toggleExpanded(product.id)` auf (gleiche Funktion wie bisher).
3. Der aufgeklappte Variantenbereich bleibt unverändert: jede Variante mit Bild, Name, Herz, Blitz, Plus, Löschen-Icon für eigene Varianten.

**i18n (`src/i18n/de.ts` + `messages.json`)**
- Den dadurch ungenutzten Text `dept.productVariants` („Produktvarianten“) aus de.ts und allen 15 Lokalen entfernen; `dept.variants` („Varianten ({count})“) wird wiederverwendet.

## Prüfung
- Browser-Test Desktop (1280 px) und Mobil (390 px): Link mit Anzahl steht unter der Mengen-/Preiszeile, Klick klappt die Liste auf/zu, kein „Produktvarianten“-Text und kein Button neben dem Produktnamen mehr.
- Produkte ohne Varianten zeigen keinen Link; Klick aufs Produktbild führt wie bisher zur Detailseite.
- Build fehlerfrei.
