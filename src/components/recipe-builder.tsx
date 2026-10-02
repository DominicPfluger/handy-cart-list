import { uploadRecipeImage } from "../lib/recipe-images";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useT } from "../i18n";
import type { MessageKey } from "../i18n/de";
import { matchesProductSearch } from "../lib/catalog-query";
import { useCatalog, type CatalogProduct } from "../lib/catalog-query";
import { POPULAR_RECIPES, RECIPE_TEMPLATES, STEP_EMOJIS, type RecipeTemplate } from "../lib/recipe-templates";
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
import { RECIPE_TRAITS, TRAIT_GROUPS, type RecipeTraits } from "../lib/recipe-traits";
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

export { useRecipeTemplates, templateLabel } from "../lib/use-recipe-templates";
import { useRecipeTemplates, templateLabel } from "../lib/use-recipe-templates";

export function RecipeBuilder({ onTemplateChange, mode = "generator", loadRecipeId, initialTemplateId }: { onTemplateChange?: (id: string | null) => void; mode?: "generator" | "lists" | "inspiration"; loadRecipeId?: string | undefined; initialTemplateId?: RecipeTemplate["id"] | undefined } = {}) {
  const { t } = useT();
  const catalog = useCatalog();
  const templates = useRecipeTemplates();
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
  const [traits, setTraits] = useState<RecipeTraits>({ satiety: null, spiciness: null, price_class: null });
  const [traitsError, setTraitsError] = useState(false);
  const traitsComplete = TRAIT_GROUPS.every((g) => !!traits[g]);
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
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const summaryRef = useRef<HTMLDivElement>(null);
  const [dietOpen, setDietOpen] = useState(false);
  const [cuisineOpen, setCuisineOpen] = useState(false);
  const PAGE = 10;

  const tpl = templates.find((x) => x.id === tplId) ?? null;

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
    const template = templates.find((x) => x.id === r.template_id);
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
  }, [loadedRecipe.data, loadedId, catalog.products, catalog.recipeIngredients, templates]);
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
      // Admin-managed steps have no built-in ingredients: an empty assignment stays empty.
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

  // Akkordeon: Pflicht-Schritte steuern Fortschritt und automatisches Weiterschalten.
  const stepOk = (s: (typeof steps)[number]) => (picks[s.key] ?? []).length >= s.min;
  const requiredSteps = steps.filter((s) => s.required || s.min > 0);
  const doneRequired = requiredSteps.filter(stepOk).length;
  const allRequiredDone = requiredSteps.every(stepOk);
  useEffect(() => { setVisibleCount({}); setOpenGroups({}); }, [tplId]);

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

  const popular = useMemo(() => {
    const dbPopular = catalog.recipePopular;
    return templates.flatMap((template) => {
      const combos = dbPopular.length > 0
        ? dbPopular.filter((x) => x.templateId === template.id).sort((a, b) => a.sortOrder - b.sortOrder).map((x) => x.picks)
        : (POPULAR_RECIPES[template.id] ?? []);
      return combos.map((combo, i) => {
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
      }).filter((r) => r.items.length > 0);
    });
  }, [templates, byBase, catalog.recipeIngredients, catalog.recipePopular]);

  const visiblePopular = tpl
    ? popular.filter((r) => r.template.id === tpl.id)
    : templates.map((template) => popular.find((r) => r.template.id === template.id)).filter((r): r is (typeof popular)[number] => !!r);

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
      const updated = { ...prev, [stepKey]: next };
      return updated;
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
  const catName = tpl ? templateLabel(tpl, t) : "";
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
    if (!traitsComplete) { setTraitsError(true); toast.error(t("rk.traitsRequired")); return; }
    setBusy(true);
    try {
      const folderId = collectionId ?? (await createCollection(user.id, newName));
      const recTitle = customTitle.trim() || title;
      const recDesc = customDesc.trim() || null;
      const imagePath = photo ? await uploadRecipeImage(user.id, photo) : null;
      const rec = await createRecipe({ ownerId: user.id, authorName: user.name, title: recTitle, description: recDesc, templateId: tpl.id, picks, items: recipeItems(), isPublic: makePublic, imagePath, satiety: traits.satiety, spiciness: traits.spiciness, priceClass: traits.price_class });
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
        {TRAIT_GROUPS.map((g) => {
          const missing = traitsError && !traits[g];
          return (
            <div key={g} role="radiogroup" aria-label={t(`rk.${g}`)} aria-required="true" className="space-y-1.5">
              <p className={`text-xs font-bold ${missing ? "text-destructive" : "text-foreground"}`}>{RECIPE_TRAITS[g].emoji} {t(`rk.${g}`)} *</p>
              <div className="flex flex-wrap gap-1.5">
                {RECIPE_TRAITS[g].values.map((v) => (
                  <button key={v} type="button" role="radio" aria-checked={traits[g] === v}
                    onClick={() => setTraits((o) => ({ ...o, [g]: v }))}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${traits[g] === v ? "border-primary bg-primary text-primary-foreground" : missing ? "border-destructive bg-card text-foreground" : "border-border bg-card text-foreground"}`}>
                    {t(`rk.${g}.${v}` as Parameters<typeof t>[0])}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
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
        const rt = templates.find((x) => x.id === r.templateId);
        return (
          <button key={r.id} onClick={() => rt && openRecipe(rt.id, r.picks)} className={LIST_CARD_CLASS}>
            <ListCardBody image={rt?.image} emoji={rt?.emoji ?? "🍽️"} color={rt?.color} title={r.title} badge={new Date(r.savedAt).toLocaleDateString()} />
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
            image={r.template.image}
            emoji={r.template.emoji}
            color={r.template.color}
            kicker={!tpl ? templateLabel(r.template, t) : undefined}
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
      onOpen={(id, p) => { const rt = templates.find((x) => x.id === id); if (rt) openRecipe(rt.id, p); }}
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
    <div className="space-y-5 pb-20">
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
          <h2 className="text-lg font-bold text-foreground">{catName}</h2>
          <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl text-3xl" style={{ background: tpl.color }}>
            {tpl.image ? <img src={tpl.image} alt="" loading="lazy" className="h-full w-full object-cover" /> : tpl.emoji}
          </span>
        </div>
      )}

      {requiredSteps.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-foreground">
            <span>{t("rk.progress", { done: doneRequired, total: requiredSteps.length })}</span>
            <span className="text-muted-foreground">{Math.round((doneRequired / requiredSteps.length) * 100)} %</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(doneRequired / requiredSteps.length) * 100}%` }} />
          </div>
        </div>
      )}

      {steps.map((s) => {
        const sel0 = picks[s.key] ?? [];
        const isReq = s.required || s.min > 0;
        const missing = isReq && sel0.length < s.min;
        return (
        <div key={s.key} className={`overflow-hidden rounded-2xl border transition ${missing ? "border-destructive/60" : "border-border"} bg-card`}>
          <div className="flex w-full items-center gap-2 px-3 py-2.5 text-left">
            <span className="grid h-7 w-7 shrink-0 place-items-center text-lg" aria-hidden="true">{s.emoji || STEP_EMOJIS[s.key] || "🍽️"}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">
                {s.label}{" "}
                 <span className="text-xs font-normal text-muted-foreground">
                  ({s.max >= 99 ? t("rk.pickAny") : s.max === 1 ? t("rk.pickOne") : t("rk.pick", { min: s.min, max: s.max })})
                </span>
              </span>
              {sel0.length > 0 && (
                <span className="mt-0.5 flex flex-wrap gap-1">
                  {sel0.map((id) => {
                    const p = s.products.find((x) => x.id === id);
                    return p ? <span key={id} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-foreground">{p.emoji} {p.name}</span> : null;
                  })}
                </span>
              )}
            </span>
          </div>
          <div className="space-y-2 border-t border-border px-3 py-3">
          {s.products.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("rk.empty")}</p>
          ) : (
            (() => {
              const sel = picks[s.key] ?? [];
              const q = (stepSearch[s.key] ?? "").trim();
              const pool = q
                ? s.products.filter((p) => matchesProductSearch(p.name, q) || (p.variants ?? []).some((v) => matchesProductSearch(v, q)) || (p.synonyms ?? []).some((v) => matchesProductSearch(v, q)))
                : s.products;
              const hasGroups = s.groups.length > 0 && !q;
              const groups = hasGroups
                ? [...s.groups.map((g) => ({ key: g.id, name: g.name, emoji: g.emoji, products: pool.filter((p) => s.groupByProduct.get(p.id) === g.id) })),
                    { key: "other", name: t("rk.otherGroup"), emoji: "🧺", products: pool.filter((p) => !s.groups.some((g) => g.id === s.groupByProduct.get(p.id))) }].filter((g) => g.products.length > 0)
                : [{ key: "all", name: "", emoji: null, products: pool }];
              const chip = (p: CatalogProduct) => {
                const on = sel.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => { setSavedMsg(false); toggle(s.key, p.id, s.max); }}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition active:scale-95 ${
                      on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"
                    }`}
                  >
                    {p.emoji ? <ProductEmoji emoji={p.emoji} className="mr-1" /> : null}{p.name}
                  </button>
                );
              };
              if (!hasGroups) {
                const ordered = groups.flatMap((g) => g.products);
                const limit = visibleCount[s.key] ?? PAGE;
                const expanded = limit >= ordered.length || !!q;
                const shownIds = new Set(ordered.slice(0, expanded ? ordered.length : limit).map((p) => p.id));
                for (const id of sel) shownIds.add(id);
                const hiddenCount = ordered.filter((p) => !shownIds.has(p.id)).length;
                return <div className="space-y-3">
                  {ordered.filter((p) => shownIds.has(p.id)).map(chip)}
                  {!q && ordered.length > PAGE && <Button variant="ghost" size="sm" type="button"
                    onClick={() => setVisibleCount((x) => ({ ...x, [s.key]: expanded ? PAGE : Math.min(ordered.length, limit + PAGE) }))}
                    className="text-xs font-medium text-primary" aria-expanded={expanded}>
                    {expanded ? t("rk.showLess") : t("rk.showMore", { count: Math.min(hiddenCount, PAGE) })}
                  </Button>}
                </div>;
              }
              // Kategorie-Schalter bleiben in einer einzigen scrollbaren Reihe; Zutaten darunter ohne weitere Akkordeon-Ebene.
              return <div className="space-y-2">
                <div className="flex min-w-0 flex-wrap gap-2" role="group">
                  {groups.map((group) => {
                    const gKey = `${s.key}:${group.key}`;
                    const gOpen = !!openGroups[gKey];
                    return <Button
                      key={group.key}
                      variant="outline"
                      size="sm"
                      type="button"
                      aria-expanded={gOpen}
                      onClick={() => setOpenGroups((x) => ({ ...x, [gKey]: !gOpen }))}
                      className={`h-auto shrink-0 gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${gOpen ? "border-primary bg-primary-soft/50 text-foreground" : "border-border bg-muted text-foreground"}`}
                    >
                      {group.emoji && <span aria-hidden="true">{group.emoji}</span>}
                      {group.name}
                      <span aria-hidden="true" className="text-muted-foreground">{gOpen ? "▴" : "▾"}</span>
                    </Button>;
                  })}
                </div>
                {groups.map((group) => {
                  const gKey = `${s.key}:${group.key}`;
                  const gOpen = !!openGroups[gKey];
                  const gLimit = visibleCount[gKey] ?? PAGE;
                  const gExpanded = gLimit >= group.products.length || !!q;
                  const shownIds = new Set(group.products.slice(0, gExpanded ? group.products.length : gLimit).map((p) => p.id));
                  for (const id of sel) if (group.products.some((p) => p.id === id)) shownIds.add(id);
                  const shown = gOpen ? group.products.filter((p) => shownIds.has(p.id)) : group.products.filter((p) => sel.includes(p.id));
                  const gHidden = group.products.length - shown.length;
                  if (!shown.length && !gOpen) return null;
                  return (
                    <div key={group.key} className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {shown.map(chip)}
                      </div>
                      {gOpen && !q && gHidden > 0 && (
                        <Button variant="ghost" size="sm" type="button"
                          onClick={() => setVisibleCount((x) => ({ ...x, [gKey]: gExpanded ? PAGE : Math.min(group.products.length, gLimit + PAGE) }))}
                          className="mt-1 text-xs font-medium text-primary" aria-expanded={gExpanded}>
                          {gExpanded ? t("rk.showLess") : t("rk.showMore", { count: Math.min(gHidden, PAGE) })}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>;
            })()
          )}
          </div>
        </div>
        );
      })}

      <div ref={summaryRef} className="scroll-mt-24 rounded-2xl bg-primary-soft/40 p-4">
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
                onClick={() => { setSavedMsg(false); setCustomTitle(title); setCustomDesc(""); setTraits({ satiety: null, spiciness: null, price_class: null }); setTraitsError(false); setSaveOpen(true); }}
                className="mt-3 w-full rounded-2xl bg-primary px-4 py-4 text-lg font-bold text-primary-foreground shadow-md transition active:scale-[0.98]"
              >
                {savedMsg ? `📁 ${t("rk.saved")}` : `📁 ${t("rk.save")}`}
              </button>
            )}
            <button
              onClick={addAll}
              disabled={added}
              className="mt-2 w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition active:scale-[0.98] disabled:opacity-60"
            >
              {added ? `🛒 ${t("rk.added")}` : t("rk.addAll", { n: chosen.length })}
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
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[440px] border-t border-border bg-background/95 p-3 backdrop-blur">
      <button
        type="button"
        onClick={() => summaryRef.current?.scrollIntoView({ behavior: "smooth" })}
        disabled={!allRequiredDone}
        className="w-full rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-md transition active:scale-[0.98] disabled:opacity-50"
      >
        {t("rk.toRecipe", { n: chosen.length })}
      </button>
    </div>
    {saveDialog}
    </div>
  );
}
