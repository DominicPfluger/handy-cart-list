<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- i18n: UI strings in `src/i18n/de.ts` + `messages.json`; catalog names in `catalog_translations` via `pickName` (de-CH ß→ss). Why: light store, no SSR mismatch.
- Admin writes via RLS `has_role`; AI translation in `translate.server.ts`. Why: no service-role in app code.
- Personal data stays device-only. Why: shared catalog is admin-controlled.
- User-created product variants are device-local and merged into catalog reads; only admins change shared variants. Why: shoppers can personalize products without altering the common catalog.
- Diet filter: products.excluded_diets. Cuisine filter: `cuisines`+`product_cuisines`. Why: simple, editable.
- Diet/cuisine filters exempt non-food roots via NON_FOOD_ROOTS/isNonFoodRootName in src/lib/dept-colors.ts (also hides admin cuisine picker). Why: non-food stays visible; one source of truth.
- Catalog routes `ssr: false`. Why: SSR-embedded catalog caused 'aborted' blank screens.
- Brands: `product_brands` (locales = market codes); chosen brand appended as "Name · Marke". Why: same for cloud/local lists.
- The device-local market choice drives catalog visibility, ordering, brands, and reference prices independently of UI locale. Why: changing shopping market must not change language.
- Recipe creator: step groups in one scrollable row with inline expandable ingredients; managed templates use only admin-assigned ingredients; steps edited beside the template in admin. Why: discoverable editing, no surprise defaults.
- Aliases: `department_aliases`/`product_aliases` show items in extra places; data lives once; list category = list_items.group_label. Why: single source of truth.
- Variant favorites retain their composite favorite key while resolving the base catalog product for category, imagery, and list transfers. Why: keep variant identity without losing catalog placement.
- Read-aloud: locale, templates and pronunciation rules are admin-managed. Why: consistent speech without catalog renaming.
- Recipe folders nest via recipe_folders.parent_id (DB trigger blocks cycles); deleting a folder moves its recipes and subfolders up one level. Why: themed sorting without data loss.
- Recipe cuisines are explicit, optional many-to-many recipe assignments, independent of the device-local ingredient cuisine filter. Why: shared recipe search must not infer cuisines from personal ingredient preferences.

## Landingpage
- Erster Besuch auf `/` zeigt die Landingpage (`src/components/landing/landing-page.tsx`, Flag `shoppi:landing-seen` via `src/lib/landing.ts`); danach direkt die Einkaufsliste. Die Website-Variante liegt auf `/start` mit eigenem head(). Warum: öffentliche Seite unter der künftigen Domain, App-Entscheid bleibt geräte-lokal.
- Admin tile view (catalog-tile-editor.tsx) reuses admin.tsx data + save/reorder/remove callbacks. Why: one write path for list and tile editing.
- Admin-created locales live in app_locales + ui_translations, loaded at runtime by src/i18n; server translation targets = built-in + app_locales (targetLocales). Why: add languages without redeploy.
- Products keep full image_path plus separate 64px icon_path (compressed in admin browser, also after AI generation; icon-only generation leaves image_path untouched). Why: light list rows, detail imagery preserved.
- Admin AI image generation preserves existing icon_path values. Why: refreshing a large image must not silently change list artwork.
- Small catalog and list icons share a device-local image/symbol preference; full product photos remain unchanged. Why: one visual choice should apply consistently without changing shared catalog data.
- Displayed catalog icons use bounded device CacheStorage keyed by stable image path, with symbol fallback; expiring signed links only authorize cache misses. Why: image links rotate while artwork should download once per device.
- Vorlagen in "Listen bearbeiten" sind per Drag & Drop sortierbar (reorderTemplates, sort_order auf shopping_lists). Why: gleiche Bedienung wie bei Listen.
- Produktanlage im Admin bietet bei Abteilungen mit Überschriften eine Positions-Auswahl; neue Produkte werden am Gruppenende der gewählten Überschrift eingereiht und bestehende sort_order-Werte verschoben. Why: gezieltes Einordnen ohne nachträgliches Ziehen.
- Units live in public.units; products keep ordered preferred units with a quantity per unit, and the first mirrors the legacy default. Why: editable units and package-specific defaults.
- Unshared cloud lists are edited device-locally (`shoppi:local-lists` holds dirty ids + last synced base) and pushed only via the manual sync button as a diff; shared lists (>1 member) stay live. Why: no network traffic while shopping, user controls when the web copy updates.
- Offline catalog cache lives in IndexedDB (src/lib/catalog-idb.ts) with an in-memory mirror; route loaders use ensureCatalog to await it. Why: localStorage 5 MB limit and synchronous parsing.
- Adding a catalog item that matches an open entry (same product/name, organic flag, unit, numeric qty, no note/photo) sums quantities instead of duplicating. Why: avoid duplicate rows.
