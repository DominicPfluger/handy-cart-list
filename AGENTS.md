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
- i18n: UI strings live in `src/i18n/de.ts` (source) + generated `src/i18n/messages.json`; catalog names in `catalog_translations` resolved via `pickName` (locale → same language → German, de-CH swaps ß→ss). Why: one lightweight store, no SSR mismatch (server renders de-DE).
- Admin writes go through RLS with `has_role(auth.uid(),'admin')`; AI translation runs server-side in `translate.server.ts`. Why: no service-role use in app code.
- Personal catalog additions/renames live in localStorage (`use-custom-catalog`, `use-custom-names`) and are merged in `useCatalog`. Why: user chose device-only personal changes; shared catalog stays admin-controlled.
- Shared catalog category removal is a device-only hidden-ID list applied in the departments view, with restoration in More; custom categories use local deletion. Why: personal removals must not change the shared catalog or existing lists/favorites.
- Diet filter: products.excluded_diets (text[], AI-classified, non-food left empty); selection stored device-only in localStorage (use-diet-filter). Why: simple exclusion list, no per-user backend state.
- Recipe builder templates live in src/lib/recipe-templates.ts, ingredients referenced by German catalog baseName (missing ones hidden). Why: user will curate ingredient lists manually later without schema changes.
- Mushroom emojis (🍄, 🍄‍🟫) are never rendered directly: ProductEmoji (src/components/product-emoji.tsx) swaps them for a single edible-mushroom SVG icon, because 🍄 is the poisonous fly agaric and 🍄‍🟫 breaks into two glyphs on older devices. Why: user requirement for list icons.
- Purchase history & smart suggestions are device-only: `use-purchase-history` stores completed checkouts („Einkauf abschliessen") in localStorage key `shoppi:purchase-history`; suggestions are frequency-ranked entries from that history. Why: personal data stays local, consistent with lists/favorites pattern.
- Catalog-using routes (/, abteilungen, favoriten, rezepte, mehr, vorrat, scanner) use `ssr: false`; the catalog loads in the browser. Why: SSR embedded the full ~2.4 MB catalog in every HTML response, causing slow loads and 'aborted' blank screens on reload.
