# Plan: Kategoriebilder Weichkäse & Sahne zuweisen

## Ziel
- Bild `weichkaese.png` der bestehenden Kategorie **Weichkäse** (unter Käse) zuweisen.
- Bild `sahne.png` einer **neuen Kategorie „Sahne"** unter **Milchprodukte & Eier** zuweisen (existiert noch nicht) und dort Standard-Artikel anlegen.

## Schritte

1. **Bilder hochladen** in den bestehenden Cloud-Speicher-Bucket `catalog-images`:
   - `weichkaese.png` → `departments/weichkaese.png`
   - `sahne.png` → `departments/sahne.png`

2. **Kategorie „Sahne" anlegen** (SQL-Migration):
   - Neue Unterkategorie unter „Milchprodukte & Eier", direkt hinter „Milch" einsortiert.
   - `image_path = 'departments/sahne.png'`
   - Übersetzungen für alle 15 weiteren Sprachen (gleiche Verfahrensweise wie bei bisherigen neuen Kategorien; manuelle Übersetzungen bleiben unberührt).

3. **Standard-Artikel unter „Sahne" anlegen** (SQL-Migration), u. a.:
   Schlagsahne, Sprühsahne, Kaffeesahne, Saure Sahne, Schmand, Crème fraîche, Crème double, Sauerrahm, Halbfett-Sahne, laktosefreie Sahne.
   - Einheit „Becher" als Voreinstellung, wie im Katalog üblich.
   - Ernährungs-Ausschlüsse wie bei anderen Milchprodukten (z. B. vegan, laktosefrei je nach Artikel).
   - Übersetzungen für alle 15 weiteren Sprachen.

4. **Weichkäse-Bild zuweisen** (SQL):
   - `UPDATE departments SET image_path = 'departments/weichkaese.png' WHERE id = 'ac66c903-84e1-4dab-b1ac-67b4aa4ac217'`.

5. **Verifikation**: Abteilungsansicht im Preview prüfen — Bild auf der Weichkäse-Kachel, neue Sahne-Kategorie mit Bild und Artikeln sichtbar.
