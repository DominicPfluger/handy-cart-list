# Benutzerkonto mit Profil und Zahlungskarte

## Ziel
Benutzer können ein Konto erstellen, ihre persönlichen Angaben hinterlegen und eine Kreditkarte sicher speichern. Diese Daten nutzt später die Online-Shopping-Funktion.

## Sicherheitsgrundsatz
Kartennummern werden nie in der App oder Datenbank gespeichert. Die Eingabe läuft über ein sicheres Kartenformular von **Stripe**. Shoppi speichert nur einen Verweis sowie Kartentyp, die letzten 4 Ziffern und das Ablaufdatum (z.B. „Visa •••• 4242, 08/29“). Zuerst läuft alles im Testmodus.

## Was der Benutzer sieht
1. **Konto erstellen / Anmelden** (bestehende Seite): E-Mail & Passwort und Google. Das Konto bleibt freiwillig, die App funktioniert weiter ohne.
2. **Neue Seite „Mein Konto“** (erreichbar über „Mehr“):
   - Persönliche Angaben: Vorname, Nachname, Telefon
   - Lieferadresse: Strasse, PLZ, Ort, Land
   - Rechnungsadresse: optional, sonst „wie Lieferadresse“
   - **Zahlungsmittel**: Karte hinzufügen, entfernen oder als Standard festlegen
   - Konto löschen
3. Datenschutzseite ergänzen: Welche Daten gespeichert werden und wofür.

## Ablauf: Karte hinzufügen
```text
"Karte hinzufügen" -> sicheres Stripe-Formular -> Stripe speichert die Karte
 -> Shoppi merkt sich nur Verweis + "Visa •••• 4242"
```
Belastet wird dabei nichts. Abgebucht wird erst später beim Online-Einkauf.

## Technische Details
- Stripe über die integrierte Zahlungsfunktion aktivieren (Testmodus).
- Migration: `profiles` (id → auth.users, Name, Telefon, Liefer-/Rechnungsadresse als Spalten, `stripe_customer_id`) mit Trigger, der bei der Registrierung automatisch ein Profil anlegt. `payment_methods` (user_id, stripe_payment_method_id, brand, last4, exp_month, exp_year, is_default). GRANTs + RLS nur für eigene Zeilen; `stripe_customer_id` darf nur der Server setzen.
- Server-Funktionen (`requireSupabaseAuth`): `createSetupIntent` (legt Stripe-Kunden an falls nötig), `savePaymentMethod`, `removePaymentMethod`, `setDefaultPaymentMethod`, `deleteAccount`.
- Neue Route `src/routes/_authenticated/konto.tsx`; Stripe Elements (Payment Element im Setup-Modus), clientseitig geladen.
- Eintrag „Mein Konto“ in `mehr.tsx`; i18n-Schlüssel `acct.*` in `de.ts`.
- E-Mail-Anmeldung im Backend aktivieren, Google konfigurieren.
- Regel in AGENTS.md: Karten nur über Stripe speichern, lokal nur Metadaten.

## Nicht enthalten
Der Shop selbst (Warenkorb, Bestellung, Abbuchung) folgt später.
