import { uploadRecipeImage } from "../lib/recipe-images";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useT } from "../i18n";
import type { MessageKey } from "../i18n/de";
import { useCatalog, type CatalogProduct } from "../lib/catalog-query";
import { POPULAR_RECIPES, RECIPE_TEMPLATES, type RecipeTemplate } from "../lib/recipe-templates";
import { useShoppingList } from "../hooks/use-shopping-list";
import { DIETS, DIET_EMOJI, setDiets, toggleDiet, useDietFilter } from "../hooks/use-diet-filter";
import { setCuisines, toggleCuisine, useCuisineFilter } from "../hooks/use-cuisine-filter";
import { formatQuantity } from "../lib/units";
import { ProductEmoji } from "./product-emoji";
import { Button } from "./ui/button";
import {
  createCollection, saveToFolder, useRecipeCollections, flattenTree, folderPath,
} from "../hooks/use-saved-recipes";
import { useAuthUser } from "../hooks/use-auth-user";
import { createRecipe, fetchRecipe, publishRecipe, shareLink, type RecipeItem } from "../lib/recipes-api";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { SavedRecipesBoard } from "./saved-recipes-board";
import { SectionTitle, ListCardBody, LIST_CARD_CLASS } from "./recipe-feed";

type Picks = Record<string, string[]>; // stepKey -> productIds

function shuffle<T>(a: T[]) {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j]!, r[i]!];
  }
  return r;
}

export function RecipeBuilder({ onTemplateChange, mode = "generator", loadRecipeId, initialTemplateId }: { onTemplateChange?: (id: string | null) => void; mode?: "generator" | "lists" | "inspiration"; loadRecipeId?: string | undefined; initialTemplateId?: RecipeTemplate["id"] | undefined } = {}) {
  const { t } = useT();
  const catalog = useCatalog();
  const { addCatalogItem, favorites } = useShoppingList();
  const [tplId, setTplIdRaw] = useState<RecipeTemplate["id"] | null>(initialTemplateId ?? null);
  const setTplId = (id: RecipeTemplate["id"] | null) => { setTplIdRaw(id); onTemplateChange?.(id); };
  const [picks, setPicks] = useState<Picks>({});
  const [added, setAdded] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [newName, setNewName] = useState("");
  const [makePublic, setMakePublic] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const photoUrl = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);
  const [customTitle, setCustomTitle] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const user = useAuthUser();
  const collections = useRecipeCollections(user);
  const [busy, setBusy] = useState(false);
  const [onlyFav, setOnlyFav] = useState(false);
  const diets = useDietFilter();
  const cuisineSel = useCuisineFilter();
  const cuisines = useMemo(() => cuisineSel.filter((id) => catalog.cuisines.some((c) => c.id === id)), [cuisineSel, catalog.cuisines]);
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [showAllPopular, setShowAllPopular] = useState(false);

  const favIds = useMemo(() => new Set(favorites.map((f) => f.productId)), [favorites]);

  const byBase = useMemo(() => {
    const m = new Map<string, CatalogProduct>();
    for (const p of catalog.products) if (!m.has(p.baseName)) m.set(p.baseName, p);
    return m;
  }, [catalog.products]);
  const [visibleCount, setVisibleCount] = useState<Record<string, number>>({});
  const [openIngredientGroups, setOpenIngredientGroups] = useState<Record<string, string>>({});
  const [dietOpen, setDietOpen] = useState(false);
  const [cuisineOpen, setCuisineOpen] = useState(false);
  const PAGE = 12;
  const THRESHOLD = 18;

  const tpl = RECIPE_TEMPLATES.find((x) => x.id === tplId) ?? null;

  // Ein gespeichertes/geteiltes Rezept in den Generator laden (Klick auf Community-Karte).
  const loadedRecipe = useQuery({
    queryKey: ["recipe-load", loadRecipeId],
    queryFn: () => fetchRecipe(loadRecipeId!),
    enabled: !!loadRecipeId,
  });
  const [loadedId, setLoadedId] = useState<string | null>(null);
  useEffect(() => {
    const r = loadedRecipe.data;
    if (!r || loadedId === r.id || catalog.products.length === 0) return;
    const template = RECIPE_TEMPLATES.find((x) => x.id === r.template_id);
    if (!template) return;
    const next: Picks = {};
    for (const item of r.items) {
      const step = template.steps.find((s) => {
        const dbIds = catalog.recipeIngredients
          .filter((ri) => ri.templateId === template.id && ri.stepKey === s.key)
          .map((ri) => ri.productId);
        if (dbIds.length > 0) return dbIds.includes(item.productId);
        const p = catalog.products.find((x) => x.id === item.productId);
        return !!p && s.ingredients.includes(p.baseName);
      });
      if (!step) continue;
      (next[step.key] ??= []).push(item.productId);
    }
    setTplId(template.id);
    setPicks(next);
    setCustomTitle(r.title);
    setCustomDesc(r.description ?? "");
    setLoadedId(r.id);
  }, [loadedRecipe.data, loadedId, catalog.products, catalog.recipeIngredients]);
  const steps = useMemo(
    () => (tpl?.steps ?? []).map((s) => {
      // Zutaten aus dem Backend (Admin-gepflegt); Fallback: feste Liste aus dem Code.
      const dbIds = catalog.recipeIngredients
        .filter((r) => r.templateId === tpl!.id && r.stepKey === s.key)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((r) => r.productId);
      const fromDb = dbIds
        .map((id) => catalog.products.find((p) => p.id === id))
        .filter((p): p is CatalogProduct => !!p);
      const base = fromDb.length > 0
        ? fromDb
        : s.ingredients.map((n) => byBase.get(n)).filter((p): p is CatalogProduct => !!p);
      const picked = picks[s.key] ?? [];
      const visible = base.filter((p) => {
        if (picked.includes(p.id)) return true;
        if (onlyFav && !favIds.has(p.id)) return false;
        if (diets.length && p.excludedDiets.some((d) => (diets as string[]).includes(d))) return false;
        if (cuisines.length && !p.cuisineIds.some((c) => cuisines.includes(c))) return false;
        return true;
      });
      const groupByProduct = new Map(catalog.recipeIngredients
        .filter((r) => r.templateId === tpl?.id && r.stepKey === s.key)
        .map((r) => [r.productId, r.groupId]));
      const groups = catalog.recipeGroups
        .filter((g) => visible.some((p) => groupByProduct.get(p.id) === g.id))
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
      return {
        ...s,
        products: visible,
        groups,
        groupByProduct,
      };
    }),
    [tpl, byBase, onlyFav, favIds, diets, cuisines, picks, catalog.recipeIngredients, catalog.products, catalog.recipeGroups],
  );

  const toggleOnlyFav = () => {
    setOnlyFav((v) => {
      const next = !v;
      if (next) {
        setPicks((prev) => {
          const pruned: Picks = {};
          for (const [k, ids] of Object.entries(prev)) {
            const kept = ids.filter((id) => favIds.has(id));
            if (kept.length) pruned[k] = kept;
          }
          return pruned;
        });
      }
      return next;
    });
  };

  const popular = useMemo(() => RECIPE_TEMPLATES.flatMap((template) =>
    POPULAR_RECIPES[template.id].map((combo, i) => {
      const p: Picks = {};
      const items: CatalogProduct[] = [];
      for (const step of template.steps) {
        const dbIds = catalog.recipeIngredients
          .filter((r) => r.templateId === template.id && r.stepKey === step.key)
          .map((r) => r.productId);
        const ps = (combo[step.key] ?? [])
          .map((n) => byBase.get(n))
          .filter((x): x is CatalogProduct => !!x && (dbIds.length > 0 ? dbIds.includes(x.id) : step.ingredients.includes(x.baseName)));
        p[step.key] = ps.map((x) => x.id);
        items.push(...ps);
      }
      return { key: `${template.id}-${i}`, template, picks: p, items };
    }).filter((r) => r.items.length > 0)
  ), [byBase, catalog.recipeIngredients]);

  const visiblePopular = tpl
    ? popular.filter((r) => r.template.id === tpl.id)
    : RECIPE_TEMPLATES.map((template) => popular.find((r) => r.template.id === template.id)).filter((r): r is (typeof popular)[number] => !!r);

  const recent = useMemo(
    () => collections
      .flatMap((c) => c.recipes.map((r) => ({ ...r, collectionId: c.id })))
      .filter((r) => !tpl || r.templateId === tpl.id)
      .sort((a, b) => b.savedAt - a.savedAt),
    [collections, tpl],
  );
  const recentShown = showAllRecent ? recent : recent.slice(0, 5);
  const popularShown = showAllPopular ? visiblePopular : visiblePopular.slice(0, 5);

  const openRecipe = (id: RecipeTemplate["id"], p: Picks) => {
    setTplId(id); setPicks(p); setAdded(false); setSavedMsg(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggle = (stepKey: string, id: string, max: number) => {
    setAdded(false);
    setPicks((prev) => {
      const cur = prev[stepKey] ?? [];
      if (cur.includes(id)) return { ...prev, [stepKey]: cur.filter((x) => x !== id) };
      const next = max === 1 ? [id] : cur.length >= max ? [...cur.slice(1), id] : [...cur, id];
      return { ...prev, [stepKey]: next };
    });
  };

  const surprise = () => {
    setAdded(false);
    const p: Picks = {};
    for (const s of steps) {
      const lo = Math.max(s.min, s.max > 1 ? 1 : s.min);
      const n = Math.min(s.products.length, lo + Math.floor(Math.random() * (s.max - lo + 1)));
      p[s.key] = shuffle(s.products).slice(0, n).map((x) => x.id);
    }
    setPicks(p);
  };

  const chosen = steps.flatMap((s) => (picks[s.key] ?? []).map((id) => s.products.find((p) => p.id === id)!).filter(Boolean));
  const catName = tpl ? t(`rk.cat.${tpl.id}` as MessageKey) : "";
  const title = chosen.length
    ? `${catName}: ${chosen.slice(0, 3).map((p) => p.name).join(", ")}${chosen.length > 3 ? " …" : ""}`
    : "";

  const addAll = () => {
    for (const p of chosen) {
      const g = catalog.departments.find((d) => d.id === p.departmentId);
      addCatalogItem({
        productId: p.id,
        name: p.name,
        quantity: formatQuantity(p.defaultQuantity, p.defaultUnit),
        unit: p.defaultUnit,
        organic: false,
        emoji: p.emoji,
        imageUrl: p.imageUrl,
        groupLabel: g?.name,
        groupEmoji: g?.emoji ?? undefined,
      });
    }
    setAdded(true);
  };

  const recipeItems = (): RecipeItem[] => chosen.map((p) => ({
    productId: p.id, name: p.name, emoji: p.emoji, quantity: formatQuantity(p.defaultQuantity, p.defaultUnit), unit: p.defaultUnit,
  }));

  const doSave = async (collectionId: string | null) => {
    if (!tpl || !user || busy) return;
    setBusy(true);
    try {
      const folderId = collectionId ?? (await createCollection(user.id, newName));
      const recTitle = customTitle.trim() || title;
      const recDesc = customDesc.trim() || null;
      const imagePath = photo ? await uploadRecipeImage(user.id, photo) : null;
      const rec = await createRecipe({ ownerId: user.id, authorName: user.name, title: recTitle, description: recDesc, templateId: tpl.id, picks, items: recipeItems(), isPublic: makePublic, imagePath });
      await saveToFolder(user.id, rec.id, folderId);
      if (makePublic && rec.share_slug) {
        const how = await shareLink(rec.share_slug, recTitle);
        if (how === "copied") toast.success(t("rs.linkCopied"));
      }
      setSaveOpen(false);
      setNewName("");
      setCustomTitle("");
      setCustomDesc("");
      setPhoto(null);
      setSavedMsg(true);
    } catch {
      toast.error(t("cloud.error"));
    } finally { setBusy(false); }
  };

  const doShare = async () => {
    if (!tpl || !user || busy) return;
    setBusy(true);
    try {
      const rec = await createRecipe({ ownerId: user.id, authorName: user.name, title, description: customDesc.trim() || null, templateId: tpl.id, picks, items: recipeItems(), isPublic: true });
      const how = await shareLink(rec.share_slug!, title);
      if (how === "copied") toast.success(t("rs.linkCopied"));
    } catch {
      toast.error(t("cloud.error"));
    } finally { setBusy(false); }
  };

  const shareSaved = async (recipeId: string, recTitle: string) => {
    try {
      const slug = await publishRecipe(recipeId);
      const how = await shareLink(slug, recTitle);
      if (how === "copied") toast.success(t("rs.linkCopied"));
    } catch { toast.error(t("cloud.error")); }
  };

  const saveDialog = saveOpen && (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/40" onClick={() => setSaveOpen(false)}>
      <div className="w-full max-w-[440px] space-y-3 rounded-t-3xl bg-background p-5 pb-8" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-bold text-foreground">{t("rk.saveTo")}</h3>
        <input
          value={customTitle}
          onChange={(e) => setCustomTitle(e.target.value)}
          placeholder={t("rk.recipeTitle")}
          className="w-full rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground outline-none focus:border-primary"
        />
        <textarea
          value={customDesc}
          onChange={(e) => setCustomDesc(e.target.value)}
          placeholder={t("rk.recipeDesc")}
          rows={3}
          maxLength={2000}
          className="w-full resize-none rounded-2xl border border-border bg-card px-4 py-2 text-sm text-foreground outline-none focus:border-primary"
        />
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-2">
          {photoUrl
            ? <img src={photoUrl} alt="" className="h-16 w-16 rounded-xl object-cover" />
            : <span className="grid h-16 w-16 place-items-center rounded-xl bg-muted text-2xl" aria-hidden="true">📷</span>}
          <span className="text-sm font-semibold text-foreground">{t(photo ? "rk.changePhoto" : "rk.addPhoto")}</span>
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
        </label>
        <div role="radiogroup" aria-label={t("rs.visibility")} className="grid grid-cols-2 gap-2">
          {([false, true] as const).map((pub) => (
            <button
              key={String(pub)}
              type="button"
              role="radio"
              aria-checked={makePublic === pub}
              onClick={() => setMakePublic(pub)}
              className={`rounded-2xl border px-3 py-2 text-left transition ${makePublic === pub ? "border-primary bg-primary-soft/50" : "border-border bg-card"}`}
            >
              <span className="block text-sm font-semibold text-foreground">{t(pub ? "rs.public" : "rs.private")}</span>
              <span className="block text-xs text-muted-foreground">{t(pub ? "rs.publicHint" : "rs.privateHint")}</span>
            </button>
          ))}
        </div>
        {flattenTree(collections).map(({ c }) => (
          <button key={c.id} onClick={() => doSave(c.id)} className="flex w-full items-center justify-between gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm font-semibold text-foreground">
            <span className="min-w-0 truncate">📁 {folderPath(collections, c.id)}</span><span className="text-xs text-muted-foreground">{c.recipes.length}</span>
          </button>
        ))}
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t("rk.collectionPh")}
            className="min-w-0 flex-1 rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
          <button
            onClick={() => doSave(null)}
            disabled={busy}
            className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            + {t("rk.newCollection")}
          </button>
        </div>
        <button onClick={() => setSaveOpen(false)} className="w-full py-2 text-sm text-muted-foreground">{t("rk.cancel")}</button>
      </div>
    </div>
  );

  const recentView = (
    <section className="space-y-2">
      <SectionTitle emoji="🆕" bg="#E3F0E4">{t("rk.recent")}</SectionTitle>
      {recent.length === 0 && <p className="text-sm text-muted-foreground">{t("rk.emptyCollection")}</p>}
      {recentShown.map((r) => {
        const rt = RECIPE_TEMPLATES.find((x) => x.id === r.templateId);
        return (
          <button key={r.id} onClick={() => rt && openRecipe(rt.id, r.picks)} className={LIST_CARD_CLASS}>
            <ListCardBody emoji={rt?.emoji ?? "🍽️"} color={rt?.color} title={r.title} badge={new Date(r.savedAt).toLocaleDateString()} />
          </button>
        );
      })}
      {recent.length > 5 && (
        <button onClick={() => setShowAllRecent((v) => !v)} className="w-full py-1 text-sm font-semibold text-primary">
          {showAllRecent ? t("rk.showLess") : t("rk.showAllRecent")}
        </button>
      )}
    </section>
  );

  const popularView = visiblePopular.length > 0 && (
    <section className="space-y-2">
      <SectionTitle emoji="⭐" bg="#FFF3CD">{t("rk.popular")}</SectionTitle>
      {popularShown.map((r) => (
        <button key={r.key} onClick={() => openRecipe(r.template.id, r.picks)} className={LIST_CARD_CLASS}>
          <ListCardBody
            emoji={r.template.emoji}
            color={r.template.color}
            kicker={!tpl ? t(`rk.cat.${r.template.id}` as MessageKey) : undefined}
            title={`${r.items.slice(0, 3).map((p) => p.name).join(", ")}${r.items.length > 3 ? " …" : ""}`}
            badge={t("rk.ingredientsN", { n: r.items.length })}
          />
        </button>
      ))}
      {visiblePopular.length > 5 && (
        <button onClick={() => setShowAllPopular((v) => !v)} className="w-full py-1 text-sm font-semibold text-primary">
          {showAllPopular ? t("rk.showLess") : t("rk.showAllPopular")}
        </button>
      )}
    </section>
  );

  const collectionsView = user ? (
    <SavedRecipesBoard
      collections={collections}
      userId={user.id}
      filterTemplate={tpl?.id ?? null}
      onOpen={(id, p) => { const rt = RECIPE_TEMPLATES.find((x) => x.id === id); if (rt) openRecipe(rt.id, p); }}
    />
  ) : null;

  if (!tpl) {
    if (mode === "generator") return <div className="space-y-5" id="rk-generator" />;
    return (
      <div className="space-y-5" id="rk-generator">
       {mode === "lists" && (collectionsView ?? <Link to="/auth" className="block rounded-full border border-primary px-4 py-2.5 text-center text-sm font-semibold text-primary">{t("rs.signInToSave")}</Link>)}
       {mode === "inspiration" && <>{popularView}{recentView}</>}
       </div>
    );
  }

  return (
    <div className="space-y-5">
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        {mode === "generator"
          ? <Link to="/rezepte" className="shrink-0 text-xs font-semibold text-primary">← {t("rk.back")}</Link>
          : <button onClick={() => setTplId(null)} className="shrink-0 text-xs font-semibold text-primary">← {t("rk.back")}</button>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setDietOpen((v) => !v)}
            aria-expanded={dietOpen}
            aria-label={t("diet.filter")}
            title={`${t("diet.filter")}${diets.length ? ` · ${diets.length}` : ""}`}
            className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-semibold leading-tight transition ${diets.length ? "bg-primary text-primary-foreground" : "border border-border bg-background text-foreground"}`}
          >
            <span className="text-sm leading-none">🥗</span>
            {t("diet.filter")}
          </button>
          <button
            type="button"
            onClick={() => setCuisineOpen((v) => !v)}
            aria-expanded={cuisineOpen}
            aria-label={t("cuisine.filter")}
            title={`${t("cuisine.filter")}${cuisines.length ? ` · ${cuisines.length}` : ""}`}
            className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-semibold leading-tight transition ${cuisines.length ? "bg-primary text-primary-foreground" : "border border-border bg-background text-foreground"}`}
          >
            <span className="text-sm leading-none">🌍</span>
            {t("cuisine.filter")}
          </button>
          <button
            onClick={toggleOnlyFav}
            aria-pressed={onlyFav}
            className={`shrink-0 whitespace-nowrap rounded-full border px-2 py-1 text-[11px] font-semibold leading-tight transition ${
              onlyFav ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground"
            }`}
          >
            ♥ {t("rk.onlyFavorites")}
          </button>
          <button onClick={surprise} className="shrink-0 whitespace-nowrap rounded-full bg-accent px-2 py-1 text-[11px] font-semibold leading-tight text-accent-foreground">
            {t("rk.surprise")}
          </button>
          <button onClick={() => { setPicks({}); setAdded(false); }} className="shrink-0 whitespace-nowrap rounded-full border border-border px-2 py-1 text-[11px] font-semibold leading-tight text-foreground">
            {t("rk.reset")}
          </button>
      </div>

      {dietOpen && (
        <section className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="mb-1 text-sm font-semibold text-foreground">{t("diet.title")}</div>
          <p className="mb-3 text-xs text-muted-foreground">{t("diet.hint")}</p>
          <div className="flex flex-wrap gap-1.5">
            {DIETS.map((d) => {
              const on = diets.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleDiet(d)}
                  className={`flex h-8 items-center gap-1 rounded-full border px-2.5 text-[11px] font-medium leading-none ${on ? "border-primary bg-primary/15 text-foreground" : "border-border bg-background text-foreground"}`}
                >
                  <span className="text-sm leading-none">{DIET_EMOJI[d]}</span>
                  {t(`diet.${d}`)}
                </button>
              );
            })}
          </div>
          {diets.length > 0 && (
            <button type="button" onClick={() => setDiets([])} className="mt-2 text-xs font-medium text-primary">
              {t("diet.reset")}
            </button>
          )}
        </section>
      )}

      {cuisineOpen && (
        <section className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="mb-1 text-sm font-semibold text-foreground">{t("cuisine.title")}</div>
          <p className="mb-3 text-xs text-muted-foreground">{t("cuisine.hint")}</p>
          <div className="flex flex-wrap gap-1.5">
            {catalog.cuisines.map((c) => {
              const on = cuisines.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleCuisine(c.id)}
                  className={`flex h-8 items-center gap-1 rounded-full border px-2.5 text-[11px] font-medium leading-none ${on ? "border-primary bg-primary/15 text-foreground" : "border-border bg-background text-foreground"}`}
                >
                  {c.emoji && <span className="text-sm leading-none">{c.emoji}</span>}
                  {c.name}
                </button>
              );
            })}
          </div>
          {cuisines.length > 0 && (
            <button type="button" onClick={() => setCuisines([])} className="mt-2 text-xs font-medium text-primary">
              {t("diet.reset")}
            </button>
          )}
        </section>
      )}


      {mode !== "generator" && (
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl text-3xl" style={{ background: tpl.color }}>{tpl.emoji}</span>
          <h2 className="text-lg font-bold text-foreground">{catName}</h2>
        </div>
      )}

      {steps.map((s) => (
        <div key={s.key} className="space-y-2">
          <p className="text-sm font-semibold text-foreground">
            {s.label}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              ({s.max >= 99 ? t("rk.pickAny") : s.max === 1 ? t("rk.pickOne") : t("rk.pick", { min: s.min, max: s.max })})
            </span>
          </p>
          {s.products.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("rk.empty")}</p>
          ) : (
            (() => {
              const sel = picks[s.key] ?? [];
              const hasGroups = s.groups.length > 0;
              const groupKey = openIngredientGroups[s.key];
              const other = s.products.filter((p) => !s.groupByProduct.get(p.id) || !s.groups.some((g) => g.id === s.groupByProduct.get(p.id)));
              if (hasGroups && !groupKey) return (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {s.groups.map((g) => {
                    const inGroup = s.products.filter((p) => s.groupByProduct.get(p.id) === g.id);
                    const selected = inGroup.filter((p) => sel.includes(p.id)).length;
                    return <Button key={g.id} variant="outline" className="h-auto min-h-12 justify-between gap-2 whitespace-normal text-left" onClick={() => setOpenIngredientGroups((prev) => ({ ...prev, [s.key]: g.id }))}>
                      <span className="min-w-0 break-words">{g.emoji && <span aria-hidden="true">{g.emoji} </span>}{g.name}</span><span className="shrink-0 text-muted-foreground">{selected ? `${selected}/` : ""}{inGroup.length} ›</span>
                    </Button>;
                  })}
                  {other.length > 0 && <Button variant="outline" className="h-auto min-h-12 justify-between gap-2 whitespace-normal text-left" onClick={() => setOpenIngredientGroups((prev) => ({ ...prev, [s.key]: "other" }))}><span>{t("rk.otherGroup")}</span><span className="text-muted-foreground">{other.filter((p) => sel.includes(p.id)).length || ""}{other.some((p) => sel.includes(p.id)) ? "/" : ""}{other.length} ›</span></Button>}
                </div>
              );
              const current = hasGroups ? (groupKey === "other" ? other : s.products.filter((p) => s.groupByProduct.get(p.id) === groupKey)) : s.products;
              const countKey = `${s.key}:${groupKey ?? "all"}`;
              const vis = visibleCount[countKey] ?? PAGE;
              const shortList = current.length < THRESHOLD;
              const open = shortList || vis >= current.length;
              const shown = open ? current : [...current.slice(0, vis), ...current.slice(vis).filter((p) => sel.includes(p.id))];
              const remaining = current.length - vis;
              return (
                <div className="space-y-2">
                  {hasGroups && <div className="flex items-center gap-2"><Button variant="ghost" size="sm" className="-ml-2" onClick={() => setOpenIngredientGroups((prev) => { const next = { ...prev }; delete next[s.key]; return next; })}>← {t("common.back")}</Button><span className="text-sm font-semibold text-foreground">{s.groups.find((g) => g.id === groupKey)?.name ?? t("rk.otherGroup")}</span></div>}
                  <div className="flex flex-wrap gap-2">
                    {shown.map((p) => {
                      const on = sel.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => { setSavedMsg(false); toggle(s.key, p.id, s.max); }}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition active:scale-95 ${
                            on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"
                          }`}
                        >
                          {p.emoji ? <ProductEmoji emoji={p.emoji} className="mr-1" /> : null}{p.name}
                        </button>
                      );
                    })}
                  </div>
                  {!shortList && (
                    <button
                      type="button"
                      onClick={() => setVisibleCount((x) => ({ ...x, [countKey]: open ? PAGE : vis + PAGE }))}
                      className="text-xs font-medium text-primary"
                      aria-expanded={open}
                    >
                      {open ? t("rk.showLess") : t("rk.showMore", { count: Math.min(remaining, PAGE) })}
                    </button>
                  )}
                </div>
              );
            })()
          )}
        </div>
      ))}

      <div className="rounded-2xl bg-primary-soft/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t("rk.yourRecipe")}</p>
        {chosen.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">{t("rk.nothing")}</p>
        ) : (
          <>
            <p className="mt-1 text-sm font-semibold text-foreground">{title}</p>
            <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
              {chosen.map((p) => (
                <li key={p.id}>• {p.name} — {formatQuantity(p.defaultQuantity, p.defaultUnit)}</li>
              ))}
            </ul>
            {user && (
              <button
                onClick={() => { setSavedMsg(false); setCustomTitle(title); setCustomDesc(""); setSaveOpen(true); }}
                className="mt-3 w-full rounded-2xl bg-primary px-4 py-4 text-lg font-bold text-primary-foreground shadow-md transition active:scale-[0.98]"
              >
                {savedMsg ? `✓ ${t("rk.saved")}` : `📁 ${t("rk.save")}`}
              </button>
            )}
            <button
              onClick={addAll}
              disabled={added}
              className="mt-2 w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition active:scale-[0.98] disabled:opacity-60"
            >
              {added ? `✓ ${t("rk.added")}` : t("rk.addAll", { n: chosen.length })}
            </button>
            {user ? (
              <button
                onClick={() => void doShare()}
                disabled={busy}
                className="mt-2 w-full rounded-full border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition active:scale-[0.98] disabled:opacity-60"
              >
                🔗 {t("rs.share")}
              </button>
            ) : user === null ? (
              <Link to="/auth" className="mt-2 block w-full rounded-full border border-primary px-4 py-2.5 text-center text-sm font-semibold text-primary">
                {t("rs.signInToSave")}
              </Link>
            ) : null}
          </>
        )}
      </div>
    </section>
    {saveDialog}
    </div>
  );
}
