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
- i18n: UI strings in `src/i18n/de.ts` + generated `messages.json`; catalog names in `catalog_translations` via `pickName` (locale → language → German; de-CH ß→ss). Why: one light store, no SSR mismatch.
- Admin writes use RLS `has_role(auth.uid(),'admin')`; AI translation server-side in `translate.server.ts`. Why: no service-role in app code.
- Personal data is device-only localStorage: custom products/names (merged in `useCatalog`), hidden shared categories/products (restore in More), diet selection, purchase history (`shoppi:purchase-history`, drives suggestions). Why: shared catalog stays admin-controlled; personal data local.
- Diet filter uses products.excluded_diets (text[], AI-classified, empty for non-food). Why: simple exclusion list.
- Catalog-using routes use `ssr: false`; catalog loads in browser. Why: SSR embedded ~2.4 MB catalog per page, causing 'aborted' blank screens.
- Cuisine filter uses `cuisines` + `product_cuisines` (admin-managed in /admin, AI-prefilled); selection device-local. Why: editable many-to-many.
- Brands: `product_brands` (locales = market codes like CH/DE, empty = all), filtered via `brandsFor`; chosen brand is appended to the list item name ("Name · Marke"). Why: works identically for cloud and local lists without extra plumbing.
