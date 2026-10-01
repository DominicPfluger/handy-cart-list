import { useMemo, useState } from "react";
import { useT } from "../i18n";
import type { MessageKey } from "../i18n/de";
import { useCatalog, type CatalogProduct } from "../lib/catalog-query";
import { POPULAR_RECIPES, RECIPE_TEMPLATES, type RecipeTemplate } from "../lib/recipe-templates";
import { useShoppingList } from "../hooks/use-shopping-list";
import { formatQuantity } from "../lib/units";
import { ProductEmoji } from "./product-emoji";
import { Button } from "./ui/button";
import {
  createCollection, deleteCollection, deleteRecipe, saveRecipe, useRecipeCollections,
} from "../hooks/use-saved-recipes";

type Picks = Record<string, string[]>; // stepKey -> productIds

function shuffle<T>(a: T[]) {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j]!, r[i]!];
  }
  return r;
}

export function RecipeBuilder({ onTemplateChange }: { onTemplateChange?: (id: string | null) => void } = {}) {
  const { t } = useT();
  const catalog = useCatalog();
  const { addCatalogItem, favorites } = useShoppingList();
  const [tplId, setTplIdRaw] = useState<RecipeTemplate["id"] | null>(null);
  const setTplId = (id: RecipeTemplate["id"] | null) => { setTplIdRaw(id); onTemplateChange?.(id); };
  const [picks, setPicks] = useState<Picks>({});
  const [added, setAdded] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [newName, setNewName] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const collections = useRecipeCollections();
  const [onlyFav, setOnlyFav] = useState(false);
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [showAllPopular, setShowAllPopular] = useState(false);

  const favIds = useMemo(() => new Set(favorites.map((f) => f.productId)), [favorites]);

  const byBase = useMemo(() => {
    const m = new Map<string, CatalogProduct>();
    for (const p of catalog.products) if (!m.has(p.baseName)) m.set(p.baseName, p);
    return m;
  }, [catalog.products]);
  const groupById = useMemo(() => new Map(catalog.recipeGroups.map((g) => [g.id, g])), [catalog.recipeGroups]);
  const groupOfIng = useMemo(() => {
    const m = new Map<string, string | null>();
    for (const r of catalog.recipeIngredients) m.set(`${r.templateId}|${r.stepKey}|${r.productId}`, r.groupId);
    return m;
  }, [catalog.recipeIngredients]);
  const NONE = "__none";
  const [openDept, setOpenDept] = useState<Record<string, string | null>>({}); // stepKey -> rootDeptId

  const tpl = RECIPE_TEMPLATES.find((x) => x.id === tplId) ?? null;
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
      return { ...s, products: base.filter((p) => !onlyFav || favIds.has(p.id)) };
    }),
    [tpl, byBase, onlyFav, favIds, catalog.recipeIngredients, catalog.products],
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

  const doSave = (collectionId: string) => {
    if (!tpl) return;
    saveRecipe(collectionId, { title: customTitle.trim() || title, templateId: tpl.id, picks });
    setSaveOpen(false);
    setNewName("");
    setCustomTitle("");
    setSavedMsg(true);
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
        {collections.map((c) => (
          <button key={c.id} onClick={() => doSave(c.id)} className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm font-semibold text-foreground">
            <span>📒 {c.name}</span><span className="text-xs text-muted-foreground">{c.recipes.length}</span>
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
            onClick={() => doSave(createCollection(newName))}
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
      <h2 className="text-lg font-bold text-foreground">🆕 {t("rk.recent")}</h2>
      {recent.length === 0 && <p className="text-sm text-muted-foreground">{t("rk.emptyCollection")}</p>}
      {recentShown.map((r) => {
        const rt = RECIPE_TEMPLATES.find((x) => x.id === r.templateId);
        return (
          <Button
            key={r.id}
            onClick={() => rt && openRecipe(rt.id, r.picks)}
            variant="outline"
            className="h-auto w-full justify-start gap-3 whitespace-normal rounded-lg p-3 text-left transition active:scale-[0.99]"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl" style={{ background: rt?.color }}>{rt?.emoji ?? "🍽️"}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">{r.title}</span>
              <span className="block text-xs text-muted-foreground">{new Date(r.savedAt).toLocaleDateString()}</span>
            </span>
          </Button>
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
      <h2 className="text-lg font-bold text-foreground">⭐ {t("rk.popular")}</h2>
      {popularShown.map((r) => (
        <Button
          key={r.key}
          onClick={() => openRecipe(r.template.id, r.picks)}
          variant="outline"
          className="h-auto w-full justify-start gap-3 whitespace-normal rounded-lg p-3 text-left transition active:scale-[0.99]"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md text-xl" style={{ background: r.template.color }}>{r.template.emoji}</span>
          <span className="min-w-0 flex-1">
            {!tpl && <span className="block text-xs text-primary">{t(`rk.cat.${r.template.id}` as MessageKey)}</span>}
            <span className="block truncate text-sm font-semibold text-foreground">{r.items.slice(0, 3).map((p) => p.name).join(", ")}{r.items.length > 3 ? " …" : ""}</span>
            <span className="block text-xs text-muted-foreground">{t("rk.ingredientsN", { n: r.items.length })}</span>
          </span>
        </Button>
      ))}
      {visiblePopular.length > 5 && (
        <button onClick={() => setShowAllPopular((v) => !v)} className="w-full py-1 text-sm font-semibold text-primary">
          {showAllPopular ? t("rk.showLess") : t("rk.showAllPopular")}
        </button>
      )}
    </section>
  );

  const visibleCollections = collections
    .map((c) => ({ ...c, recipes: tpl ? c.recipes.filter((r) => r.templateId === tpl.id) : c.recipes }))
    .filter((c) => !tpl || c.recipes.length > 0);

  const collectionsView = visibleCollections.length > 0 && (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-foreground">{t("rk.myRecipes")}</h2>
      {visibleCollections.map((c) => (
        <div key={c.id} className="space-y-2 rounded-2xl border border-border bg-card p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">📒 {c.name}</p>
            <button onClick={() => deleteCollection(c.id)} className="text-xs text-muted-foreground">{t("rk.deleteList")}</button>
          </div>
          {c.recipes.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("rk.emptyCollection")}</p>
          ) : c.recipes.map((r) => {
            const rt = RECIPE_TEMPLATES.find((x) => x.id === r.templateId);
            return (
              <div key={r.id} className="flex items-center gap-2 rounded-xl bg-background p-2">
                <span className="text-xl">{rt?.emoji ?? "🍽️"}</span>
                <button
                  onClick={() => { if (rt) openRecipe(rt.id, r.picks); }}
                  className="min-w-0 flex-1 truncate text-left text-sm text-foreground"
                >
                  {r.title}
                </button>
                <button onClick={() => deleteRecipe(c.id, r.id)} aria-label="✕" className="px-2 text-sm text-muted-foreground">✕</button>
              </div>
            );
          })}
        </div>
      ))}
    </section>
  );

  if (!tpl) {
    return (
      <div className="space-y-5">
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">{t("rk.title")}</h2>
          <p className="text-xs text-muted-foreground">{t("rk.sub")}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {RECIPE_TEMPLATES.map((x) => (
            <button
              key={x.id}
              onClick={() => { setTplId(x.id); setPicks({}); setAdded(false); }}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition active:scale-[0.98]"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-2xl" style={{ background: x.color }}>
                {x.emoji}
              </span>
              <span className="text-sm font-semibold text-foreground">{t(`rk.cat.${x.id}` as MessageKey)}</span>
            </button>
          ))}
        </div>
      </section>
       {popularView}
       {recentView}
      {collectionsView}
      </div>
    );
  }

  return (
    <div className="space-y-5">
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button onClick={() => setTplId(null)} className="text-xs font-semibold text-primary">← {t("rk.back")}</button>
        <div className="flex gap-2">
          <button
            onClick={toggleOnlyFav}
            aria-pressed={onlyFav}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              onlyFav ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground"
            }`}
          >
            ♥ {t("rk.onlyFavorites")}
          </button>
          <button onClick={() => { setPicks({}); setAdded(false); }} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground">
            {t("rk.reset")}
          </button>
          <button onClick={surprise} className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground">
            {t("rk.surprise")}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl text-3xl" style={{ background: tpl.color }}>{tpl.emoji}</span>
        <h2 className="text-lg font-bold text-foreground">{catName}</h2>
      </div>

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
              type G = { id: string; name: string; emoji: string | null; sortOrder: number };
              const other: G = { id: NONE, name: t("rk.otherGroup"), emoji: null, sortOrder: 1e9 };
              const subOf = new Map<string, string>();
              const byRoot = new Map<string, CatalogProduct[]>();
              for (const p of s.products) {
                const gid = groupOfIng.get(`${tpl.id}|${s.key}|${p.id}`) ?? null;
                const g = gid ? groupById.get(gid) : undefined;
                const root = g ? (g.parentId && groupById.has(g.parentId) ? g.parentId : g.id) : NONE;
                subOf.set(p.id, g?.id ?? NONE);
                const arr = byRoot.get(root) ?? [];
                arr.push(p);
                byRoot.set(root, arr);
              }
              const gOf = (id: string): G => (id === NONE ? other : groupById.get(id) ?? other);
              const roots = [...byRoot.entries()]
                .map(([id, ps]) => ({ dept: gOf(id), ps }))
                .sort((a, b) => a.dept.sortOrder - b.dept.sortOrder);
              const openId = openDept[s.key] ?? null;
              const open = roots.find((r) => r.dept?.id === openId) ?? null;
              return (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {roots.map(({ dept, ps }) => {
                      const on = openId === dept?.id;
                      return (
                        <button
                          key={dept?.id ?? "x"}
                          onClick={() => setOpenDept((prev) => ({ ...prev, [s.key]: on ? null : (dept?.id ?? null) }))}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition active:scale-95 ${
                            on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"
                          }`}
                        >
                          {dept?.emoji ? <span className="mr-1">{dept.emoji}</span> : null}{dept?.name ?? "?"} ({ps.length})
                        </button>
                      );
                    })}
                  </div>
                  {open && (
                    <div className="space-y-2 rounded-2xl border border-border bg-card p-3">
                      {(() => {
                        const bySub = new Map<string, CatalogProduct[]>();
                        for (const p of open.ps) {
                          const k = subOf.get(p.id) ?? NONE;
                          const arr = bySub.get(k) ?? [];
                          arr.push(p);
                          bySub.set(k, arr);
                        }
                        return [...bySub.entries()]
                          .sort((a, b) => (a[0] === open.dept?.id ? -1 : b[0] === open.dept?.id ? 1 : gOf(a[0]).sortOrder - gOf(b[0]).sortOrder))
                          .map(([subId, ps]) => {
                          const sub = gOf(subId);
                          const isRoot = subId === open.dept?.id;
                          return (
                            <div key={subId} className="space-y-1.5">
                              {!isRoot && (
                                <p className="text-xs font-semibold text-muted-foreground">
                                  {sub?.emoji ? <span className="mr-1">{sub.emoji}</span> : null}{sub?.name ?? "?"}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-2">
                                {ps.map((p) => {
                                  const on = (picks[s.key] ?? []).includes(p.id);
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
                            </div>
                          );
                        });
                      })()}
                    </div>
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
            <button
              onClick={addAll}
              disabled={added}
              className="mt-3 w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition active:scale-[0.98] disabled:opacity-60"
            >
              {added ? `✓ ${t("rk.added")}` : t("rk.addAll", { n: chosen.length })}
            </button>
            <button
              onClick={() => { setSavedMsg(false); setCustomTitle(title); setSaveOpen(true); }}
              className="mt-2 w-full rounded-full border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition active:scale-[0.98]"
            >
              {savedMsg ? `✓ ${t("rk.saved")}` : `📒 ${t("rk.save")}`}
            </button>
          </>
        )}
      </div>
    </section>
    {popularView}
    {recentView}
    {collectionsView}
    {saveDialog}
    </div>
  );
}
