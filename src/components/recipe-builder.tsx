import { useMemo, useState } from "react";
import { useT } from "../i18n";
import type { MessageKey } from "../i18n/de";
import { useCatalog, type CatalogProduct } from "../lib/catalog-query";
import { RECIPE_TEMPLATES, type RecipeTemplate } from "../lib/recipe-templates";
import { useShoppingList } from "../hooks/use-shopping-list";
import { formatQuantity } from "../lib/units";

type Picks = Record<string, string[]>; // stepKey -> productIds

function shuffle<T>(a: T[]) {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j]!, r[i]!];
  }
  return r;
}

export function RecipeBuilder() {
  const { t } = useT();
  const catalog = useCatalog();
  const { addCatalogItem } = useShoppingList();
  const [tplId, setTplId] = useState<RecipeTemplate["id"] | null>(null);
  const [picks, setPicks] = useState<Picks>({});
  const [added, setAdded] = useState(false);

  const byBase = useMemo(() => {
    const m = new Map<string, CatalogProduct>();
    for (const p of catalog.products) if (!m.has(p.baseName)) m.set(p.baseName, p);
    return m;
  }, [catalog.products]);
  const deptById = useMemo(() => new Map(catalog.departments.map((d) => [d.id, d])), [catalog.departments]);

  const tpl = RECIPE_TEMPLATES.find((x) => x.id === tplId) ?? null;
  const steps = useMemo(
    () => (tpl?.steps ?? []).map((s) => ({
      ...s,
      products: s.ingredients.map((n) => byBase.get(n)).filter((p): p is CatalogProduct => !!p),
    })),
    [tpl, byBase],
  );

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
      const g = deptById.get(p.departmentId);
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

  if (!tpl) {
    return (
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
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button onClick={() => setTplId(null)} className="text-xs font-semibold text-primary">← {t("rk.back")}</button>
        <div className="flex gap-2">
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

      {steps.map((s, i) => (
        <div key={s.key} className="space-y-2">
          <p className="text-sm font-semibold text-foreground">
            {i + 1}. {s.label}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              ({s.max === 1 ? t("rk.pickOne") : t("rk.pick", { min: s.min, max: s.max })})
            </span>
          </p>
          {s.products.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("rk.empty")}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {s.products.map((p) => {
                const on = (picks[s.key] ?? []).includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggle(s.key, p.id, s.max)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition active:scale-95 ${
                      on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"
                    }`}
                  >
                    {p.emoji ? `${p.emoji} ` : ""}{p.name}
                  </button>
                );
              })}
            </div>
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
          </>
        )}
      </div>
    </section>
  );
}
