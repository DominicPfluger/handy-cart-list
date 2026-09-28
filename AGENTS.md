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
