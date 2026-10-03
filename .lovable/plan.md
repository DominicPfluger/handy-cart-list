# Varianten-Anzeige: grosses Vorschaubild entfernen

## Was geändert wird

Wenn man in der Abteilungsansicht ein Produkt antippt und die Varianten aufklappt, erscheint momentan oberhalb der Variantenliste ein grosses Vorschaubild des Produkts (ca. 160 px hoch, in einer umrandeten Box). Dieses Bild wird entfernt.

- Die aufklappbare Variantenliste bleibt: jede Variante zeigt weiterhin ihr kleines Symbolbild, den übersetzten Namen sowie die drei Knöpfe (♥ Favorit, ⚡ Schnell hinzufügen, + In Liste).
- „Details →" und das Ein-/Ausklappen bleiben unverändert.
- Die grossen Vorschaubilder bleiben überall sonst aktiv (Einzelansicht, Kategorie-Banner über dem Kopf der Abteilungsansicht).

## Technische Details

- Datei: `src/routes/abteilungen.tsx`
- Entfernt wird ausschliesslich der Block `{product.imagePath && (<div className="my-1.5 flex h-40 ...">...</div>)}` innerhalb des `expandedId === product.id`-Bereichs (Zeilen 726–730).
- Keine i18n-, DB- oder sonstigen Änderungen. Die Komponente `DepartmentIcon` bleibt importiert (wird weiter an anderer Stelle verwendet).

## Verifikation

- Typprüfung (tsgo) und Build fehlerfrei.
- Browser-Test: Abteilungsansicht, Produkt mit Varianten aufklappen — Variantenliste erscheint ohne grosses Bild oberhalb.
