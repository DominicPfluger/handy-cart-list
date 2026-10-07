# Varianten im Produktdialog per Drag & Drop sortieren

## Ziel
Varianten lassen sich direkt in der Variantenliste des Admin-Produkt-Bearbeiten-Dialogs durch Ziehen am Griff neu anordnen – mit Maus und auf Mobilgeräten per Finger. Die neue Reihenfolge wird beim Speichern des Produkts übernommen.

## Aktueller Stand
Die Variantenlisten in beiden Produkt-Bearbeiten-Dialogen besitzen bereits Ziehgriffe und Browser-Drag-&-Drop. Diese Umsetzung funktioniert jedoch primär mit der Maus; die bestehende mobile Zeigersteuerung des Admin-Katalogs wird dort noch nicht verwendet. Auch der separate Dialog zum schnellen Hinzufügen von Varianten nutzt dieselbe Desktop-Technik.

## Umsetzung
1. **Gemeinsame Sortierliste erstellen**
   - Die Variantenzeilen in eine kleine gemeinsame Admin-Komponente überführen.
   - Jede Zeile erhält einen klaren Ziehgriff; Umbenennen, Bild, Synonyme und Entfernen bleiben unverändert erreichbar.

2. **Maus und Touch unterstützen**
   - Sortieren über Zeigerbewegungen umsetzen, damit Maus, Stift und Finger gleich funktionieren.
   - Das Ziehen nur am Griff starten, damit Tippen auf andere Aktionen keine unbeabsichtigte Sortierung auslöst.
   - Während des Ziehens die bewegte Zeile und die Zielposition sichtbar markieren.
   - Vertikales Scrollen ausserhalb des Griffs weiterhin ermöglichen.

3. **Alle Variantenansichten vereinheitlichen**
   - Die neue Sortierung ausdrücklich in der Variantenliste des Admin-Produkt-Bearbeiten-Dialogs sowie im Kachel-Produktdialog einsetzen.
   - Den separaten Schnell-Dialog für Varianten ebenfalls auf dieselbe mobile Sortierung umstellen.
   - Im Produktdialog bleibt die Änderung bis „Speichern“ lokal; im Schnell-Dialog wird die neue Reihenfolge wie bisher direkt gespeichert.

4. **Prüfung**
   - Mehrere Varianten mit Maus und Touch nach oben und unten verschieben.
   - Danach speichern, den Dialog erneut öffnen und die persistierte Reihenfolge prüfen.
   - Sicherstellen, dass Umbenennen, Variantenbild, Synonyme, Entfernen und Scrollen weiterhin funktionieren.

## Technische Hinweise
- Die Reihenfolge bleibt im bestehenden `products.variants`-Feld gespeichert; keine Datenbankänderung ist nötig.
- Für Touch wird das im Adminbereich bereits etablierte Pointer-Event-Muster verwendet, nicht das nur eingeschränkt mobile HTML-Drag-&-Drop.
