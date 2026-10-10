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
- Personal variants merge into reads locally; shared variants are admin-only. Why: private personalization. Department labels use variantDisplayName for editor casing. Why: preserve casing across translations.
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
- First visit to `/` shows the landing page (flag `shoppi:landing-seen`, src/lib/landing.ts), then the list; website version on `/start`. Why: public page, device-local choice.
- Admin tile view (catalog-tile-editor.tsx) reuses admin.tsx data + save/reorder/remove callbacks. Why: one write path for list and tile editing.
- Admin-created locales live in app_locales + ui_translations, loaded at runtime by src/i18n; server translation targets = built-in + app_locales (targetLocales). Why: add languages without redeploy.
- Products keep image_path plus separate 64px icon_path; AI generation of either never overwrites the other. Why: light list rows, stable artwork.
- Small catalog and list icons share a device-local image/symbol preference; full product photos remain unchanged. Why: one visual choice should apply consistently without changing shared catalog data.
- Catalog artwork uses stable-path CacheStorage for 30 days; Settings can persist every category/product/variant image and icon. Why: expiring links only authorize cache misses and the full catalog stays offline.
- Vorlagen in "Listen bearbeiten" sind per Drag & Drop sortierbar (reorderTemplates, sort_order auf shopping_lists). Why: gleiche Bedienung wie bei Listen.
- Admin product creation can target a heading; new items go to that group's end, shifting sort_order. Why: precise placement.
- Units live in public.units; products keep ordered preferred units with a quantity per unit, and the first mirrors the legacy default. Why: editable units and package-specific defaults.
- Unshared cloud lists are edited device-locally (`shoppi:local-lists` holds dirty ids + last synced base) and pushed only via the manual sync button as a diff; shared lists (>1 member) stay live. Why: no network traffic while shopping, user controls when the web copy updates.
- Offline catalog cache lives in IndexedDB (src/lib/catalog-idb.ts) with an in-memory mirror; route loaders use ensureCatalog to await it. Why: localStorage 5 MB limit and synchronous parsing.
- Adding a catalog item that matches an open entry (same product/name, organic flag, unit, numeric qty, no note/photo) sums quantities instead of duplicating. Why: avoid duplicate rows.
- Store-specific catalog changes live as overrides in store_department_overrides/store_product_overrides (merged in useCatalog by the device-selected store); store_admins + is_store_admin gate writes. Why: shared catalog stays untouched, per-store views stay resettable.
