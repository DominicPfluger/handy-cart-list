# Zwei Umsetzungen: Rezepte-Admin-Icons + Varianten-Aktionen

## 1. Rezepte-Admin: Bearbeiten/Löschen als Icons neben dem Zieh-Griff
In `src/components/recipe-admin.tsx`:
- `Pencil` und `Trash2` aus `lucide-react` importieren.
- **Vorlagen-Zeilen** („Vorlagen verwalten"): Die Text-Buttons „Bearbeiten"/„Löschen" rechts durch kompakte Icon-Buttons ersetzen und **direkt neben den Zieh-Griff „⠿"** platzieren (vor dem Namen). Stift = wie bisher `setTplForm({ id, emoji })`, Papierkorb = wie bisher `removeTpl(t)` (mit Bestätigungsfrage). Der Aktiv/Deaktiviert-Umschalter bleibt rechts.
- **Oberkategorien-Zeilen** (Schritte): Dasselbe Muster — Stift und Papierkorb direkt neben „⠿" innerhalb des linken Containers; bisherige Text-Buttons rechts entfallen. Stift = wie bisher `setStepForm({...})`, Papierkorb = `removeStep(s)`.
- Icons ~14 px, Ghost-Stil, `text-muted-foreground`, Hover wie vorhandene Admin-Icon-Buttons; `disabled={busy}` bleibt; `title`/`aria-label` über vorhandene Schlüssel `adm.edit` / `adm.delete` — keine neuen Übersetzungen nötig.

## 2. Abteilungsansicht: Aktionen an Produktvarianten
In `src/routes/abteilungen.tsx` erhalten die Varianten-Zeilen dieselben drei Buttons wie die übergeordnete Produktzeile („wie bei Oberkategorie") statt nur dem jetzigen grünen Plus:
- **Herz (Favorit):** `toggleFavorite` mit Varianten-Eintrag — `productId: \`${product.id}::${v}\``, Name „Produkt · Variante", Bild/Icon der Variante (Fallback Produktbild), Standardmenge/ -einheit, Gruppen-Label wie beim Produkt. Aktiv-Zustand via `isFavorite(\`${product.id}::${v}\`)`. Auf der Favoritenseite erscheint der Eintrag als eigenständiger Favorit mit dem Variantennamen (loose Favorites rendern Namen + Bild bereits korrekt).
- **Blitz (Schnell hinzufügen):** übernimmt das bisherige Verhalten des Plus-Buttons — `quickAdd(product, group, v)` setzt die Variante direkt auf die Liste (mit Variantenbild-Fallback).
- **Grünes Plus (Produkt-hinzufügen-Dialog):** öffnet `CatalogProductDialog` mit vorgewählter Variante.
  - `catalog-product-dialog.tsx`: neues Prop `initialVariant?: string`; im Reset-Effekt `setSelected(initialVariant ? [initialVariant] : [])` (Abhängigkeit `initialVariant` ergänzen). Menge/Einheit/Bio/Notiz bleiben wie bisher.
  - `abteilungen.tsx`: State `selectedVariant`, beim Plus-Klick setzen, beim Schließen des Dialogs zurücksetzen; an den Dialog als `initialVariant` durchreichen.
- Buttons in gleicher Größe/Reihenfolge wie bei der Produktzeile (Herz ghost, Blitz ghost, Plus gefüllt grün), aria-labels mit Variantennamen über vorhandene i18n-Schlüssel (`common.addFavorite`/`removeFavorite`, `common.quickAdd`, `common.addWithQty`) — keine neuen Übersetzungen nötig.

## Verifikation
- Typprüfung + Build-Log.
- Browser-Test: Rezepte-Admin (Stift öffnet Formular, Papierkorb löscht mit Bestätigung, Drag & Drop intakt); Abteilungsansicht (Variante aufklappen → drei Buttons: Herz setzt/entfernt Favorit, Blitz legt Variante auf die Liste, Plus öffnet Dialog mit vorgewählter Variante).
- roadmap.md um beide Punkte ergänzen.
