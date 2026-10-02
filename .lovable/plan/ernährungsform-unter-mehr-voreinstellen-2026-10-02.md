# Ernährungsform unter „Mehr“ voreinstellen

- In den Einstellungen unter „Mehr“ eine Auswahl für die gewünschten Ernährungsformen ergänzen. Mehrfachauswahl bleibt möglich; ohne Auswahl werden keine Produkte wegen der Ernährungsform ausgeblendet.
- Die Auswahl auf diesem Gerät speichern. Die Abteilungsansicht und der Rezept-Generator übernehmen sie automatisch; Änderungen an einer der drei Stellen bleiben überall synchron.
- Vorhandene Einstellungen beibehalten und die Beschriftungen in allen vorhandenen App-Sprachen ergänzen.
- Auf Smartphone und Desktop prüfen, dass Auswahl, Zurücksetzen und erneutes Öffnen wie erwartet funktionieren.

## Technische Umsetzung

Die bestehende gerätelokale Ernährungsform-Auswahl (`useDietFilter`, `setDiets`, `toggleDiet`) wird im Bereich „Mehr“ wiederverwendet. Es braucht weder eine neue Datenbankspalte noch eine zweite Voreinstellung, damit bestehende Auswahlen nicht überschrieben werden.
