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
- Personal data device-only localStorage (custom names, hidden items, diet/cuisine selection, purchase history, `shoppi:product-dept`, `shoppi:speak-locale`). Why: shared catalog admin-controlled.
- Diet filter: products.excluded_diets. Cuisine filter: `cuisines`+`product_cuisines`. Why: simple, editable.
- Department diet/cuisine filters exempt non-food root categories by stable catalog base names. Why: localized and nested non-food products remain visible without changing saved preferences.
- Catalog routes `ssr: false`. Why: SSR-embedded catalog caused 'aborted' blank screens.
- Brands: `product_brands` (locales = market codes); chosen brand appended as "Name · Marke". Why: same for cloud/local lists.
- Recipe creator keeps each recipe step's groups in a single scrollable row with independently expandable inline ingredients, limits the initial product view per group, and uses only admin-assigned ingredients for managed templates; recipe steps are edited beside the selected template in admin. Why: preserve ingredient families and make their editing discoverable without nested accordions or surprise defaults.
- Aliases: `department_aliases`/`product_aliases` show items in extra places; data lives once; list category = list_items.group_label. Why: single source of truth.
- Read-aloud: own language (default de-DE) + admin templates in `speech_texts`. Why: mother tongue regardless of UI.
- Recipe folders nest via recipe_folders.parent_id (DB trigger blocks cycles); deleting a folder moves its recipes and subfolders up one level. Why: themed sorting without data loss.

## Landingpage
- Erster Besuch auf `/` zeigt die Landingpage (`src/components/landing/landing-page.tsx`, Flag `shoppi:landing-seen` via `src/lib/landing.ts`); danach direkt die Einkaufsliste. Die Website-Variante liegt auf `/start` mit eigenem head(). Warum: öffentliche Seite unter der künftigen Domain, App-Entscheid bleibt geräte-lokal.
- Admin tile view (catalog-tile-editor.tsx) reuses admin.tsx data + save/reorder/remove callbacks. Why: one write path for list and tile editing.
- Admin-created locales live in app_locales + ui_translations, loaded at runtime by src/i18n; server translation targets = built-in + app_locales (targetLocales). Why: add languages without redeploy.
- Product images keep a full image_path and a separate 64px icon_path; icons are compressed in the admin browser, including after AI generation, with a resumable backfill. Why: list rows should not download full-size images or lose detail-page imagery.
- Small catalog and list icons share a device-local image/symbol preference; full product photos remain unchanged. Why: one visual choice should apply consistently without changing shared catalog data.
- Displayed catalog icons use bounded device CacheStorage keyed by stable image path, with symbol fallback; expiring signed links only authorize cache misses. Why: image links rotate while artwork should download once per device.
