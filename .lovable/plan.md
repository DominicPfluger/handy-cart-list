Tippen auf ein Produkt in der Abteilungsansicht öffnet die Detailansicht

Aktuell:
- Produktbild: Bei Produkten mit Varianten klappt es nur die Variantenliste auf, sonst öffnet es die Detailseite.
- Produktname: öffnet den Umbenennen-Dialog.

Änderung (src/routes/abteilungen.tsx):
- Produktbild öffnet immer die Detailseite (/produkt/$id).
- Produktname öffnet ebenfalls die Detailseite. Umbenennen bleibt für Admins über den bestehenden Stift/Umbenennen-Zugang erreichbar (kleines Stift-Symbol neben dem Namen, nur für Admins).
- Der Link „Varianten (n) ▾“ klappt die Variantenliste weiterhin auf und zu.
- Herz, Blitz und Plus bleiben unverändert.

Prüfung: Im Browser auf Handy und Desktop testen, ob Bild und Name die Detailseite öffnen und der Varianten-Link weiterhin aufklappt.
