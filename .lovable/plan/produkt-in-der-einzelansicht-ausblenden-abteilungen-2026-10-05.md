# Produkt in der Einzelansicht ausblenden (Abteilungen)

## Ziel
In der Produkt-Einzelansicht (Dialog, der in der Abteilungsansicht beim Tippen auf «+» geöffnet wird) gibt es neu eine «Ausblenden»-Funktion. Das Produkt verschwindet geräte-lokal aus dem Katalog und lässt sich unter «Mehr → Ausgeblendete Produkte» wiederherstellen. Kein echtes Löschen im gemeinsamen Katalog.

## Umsetzung

1. **src/components/catalog-product-dialog.tsx**
   - Im Dialogfuss neben der bestehenden «Zur Liste hinzufügen»-Schaltfläche eine zweite, dezente Schaltfläche «Ausblenden» (EyeOff-Icon, Outline-Stil, destructive Textfarbe).
   - Klick öffnet einen Bestätigungs-AlertDialog (gleiches Muster wie rename-dialog.tsx): Titel «„{name}“ entfernen?», Text wie bisher («wird auf diesem Gerät ausgeblendet, wiederherstellbar unter Mehr»).
   - Nach Bestätigung: `hideProduct(product.id)` aus `src/hooks/use-hidden-products.ts` aufrufen und den Dialog schliessen.
   - Die Liste in `abteilungen.tsx` filtert ausgeblendete Produkte bereits heraus — dort ist keine Änderung nötig; das Produkt verschwindet sofort.

2. **i18n**
   - Neue Schlüssel `dlg.hide` («Ausblenden») und `dlg.hideConfirm` (Bestätigungstext) in `src/i18n/de.ts` und allen 15 Locale-JSONs; Titel/Wiederherstellen-Texte von `rename.*` wiederverwenden.

## Technische Details
- Ausblenden bleibt wie bisher rein geräte-lokal (`shoppi:hidden-products`), kein Datenbankzugriff, keine Admin-Rechte nötig.
- Wiederherstellen weiterhin über «Mehr → Ausgeblendete Produkte» (bestehende Funktion).
- Vorlagen-/Varianten-Verhalten bleibt unverändert.

## Test
- Playwright: Produkt in Abteilungen öffnen → Ausblenden → Bestätigen → Produkt ist aus der Liste verschwunden; unter «Mehr → Ausgeblendete Produkte» wiederherstellbar; Typprüfung und Build fehlerfrei.
