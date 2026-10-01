# Rezept-Inspirationen und Community-Rezepte kombinieren

## Ziel
Die Community-Rezepte erscheinen direkt auf der Seite „✨ Rezept-Inspirationen" — als eigener Abschnitt unten, unter den Ranglisten. Die separate Community-Kachel und die eigenständige /community-Seite entfallen; alte /community-Links leiten weiter.

## Änderungen

### 1. Community-Bereich als wiederverwendbare Komponente
- Den Seiteninhalt von `src/routes/community.tsx` (Tabs „Alle Rezepte / Meine geteilten", Autorenfilter-Hinweis, Suchfeld, Kategorie-Chips, Karten mit Veröffentlichen/Foto) in eine neue Komponente `src/components/community-section.tsx` auslagern.
- Rück-Link und eigene h1-Überschrift wandern nicht mit; die Komponente beginnt mit dem Tab-Umschalter. Die Suche/Filter-Logik bleibt unverändert.
- Die interne Navigation (`navigate({ from: "/community" })`, Autoren-Links, Search-Params `tab/author/name`) wird auf `/rezepte/inspirationen` umgestellt.

### 2. Inspirations-Seite erweitern
- `src/routes/rezepte.inspirationen.tsx` erhält nach `<RecipeBuilder mode="inspiration" />` einen Zwischentitel („🌍 Community-Rezepte", i18n-Schlüssel `cm.title`, mit Kurzbeschreibung `cm.subtitle`) und darunter `<CommunitySection />`.
- Search-Params (`tab`, `author`, `name`) mit zodValidator auf dieser Route ergänzen, damit Autorenprofile und Tabs als Links funktionieren.
- Head-Metadaten um den Community-Aspekt ergänzen (Titel/Beschreibung nennen sowohl Ranglisten als auch Community-Rezepte).

### 3. Rezepte-Hauptseite aufräumen
- `src/routes/rezepte.index.tsx`: die separate 🌍-Kachel (`Link to="/community"`) entfernen. Übrig bleiben die drei Kacheln Generator, Listen, Inspirationen; die Beschreibung der Inspirations-Kachel (`rec.entryInspDesc`) erwähnt zusätzlich die Community-Rezepte.

### 4. Alte Route als Weiterleitung
- `src/routes/community.tsx` wird zu einer reinen Weiterleitung: `beforeLoad: () => { throw redirect({ to: "/rezepte/inspirationen", search: { tab: "all", author: "", name: "" } }) }` — alte Links, Lesezeichen und geteilte Autoren-Links funktionieren weiter.
- i18n: keine neuen Schlüssel nötig (bestehende `cm.*`, `rs.*`, `rk.*` werden wiederverwendet).

## Betroffene Dateien
- `src/components/community-section.tsx` (neu)
- `src/routes/rezepte.inspirationen.tsx`
- `src/routes/rezepte.index.tsx`
- `src/routes/community.tsx` (wird Weiterleitung)

## Verifikation
- Build fehlerfrei; /rezepte/inspirationen zeigt Ranglisten und darunter die Community-Liste.
- Tab „Meine geteilten", Suche, Kategorie-Filter und Autoren-Link funktionieren auf der neuen Seite.
- Aufruf von /community landet auf /rezepte/inspirationen (Weiterleitung geprüft, auch mit Suchparametern).
