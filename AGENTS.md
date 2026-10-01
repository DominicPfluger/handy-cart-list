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
- Catalog routes `ssr: false`. Why: SSR-embedded catalog caused 'aborted' blank screens.
- Brands: `product_brands` (locales = market codes); chosen brand appended as "Name · Marke". Why: same for cloud/local lists.
- Recipe creator groups by admin `recipe_groups` (recipe_ingredients.group_id). Why: curated, independent of store.
- Aliases: `department_aliases`/`product_aliases` show items in extra places; data lives once; list category = list_items.group_label. Why: single source of truth.
- Read-aloud: own language (default de-DE) + admin templates in `speech_texts`. Why: mother tongue regardless of UI.
