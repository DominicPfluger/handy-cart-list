import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useT } from "../i18n";
import { matchesProductSearch } from "../lib/catalog-query";
import { formatQuantity } from "../lib/units";
import type { Catalog } from "../lib/catalog.functions";
import { ProductIcon } from "./catalog-icon";
import { PlusIcon } from "./icons";

type AddFn = (p: {
  productId: string; departmentId?: string; name: string; quantity: string; unit: string;
  organic: boolean; emoji?: string | null | undefined; imageUrl?: string | null | undefined;
  groupLabel?: string | undefined; groupEmoji?: string | undefined;
}) => void;

/** Volltext-Suche über den ganzen Katalog (Namen, Varianten, Synonyme) mit Sofort-Hinzufügen. */
export function GlobalSearch({ catalog, onAdd, onAddFree }: { catalog: Catalog; onAdd: AddFn; onAddFree: (name: string) => void }) {
  const { t } = useT();
  const [q, setQ] = useState("");
  const nq = q.trim().toLocaleLowerCase();
  const depts = useMemo(() => new Map(catalog.departments.map((d) => [d.id, d])), [catalog.departments]);

  const results = useMemo(() => {
    if (nq.length < 2) return [];
    const out: { key: string; p: Catalog["products"][number]; variant?: string; hint?: string; score: number }[] = [];
    for (const p of catalog.products) {
      const name = p.name.toLocaleLowerCase();
      if (matchesProductSearch(p.name, nq)) out.push({ key: p.id, p, score: name.startsWith(nq) ? 0 : 1 });
      else {
        const syn = (p.synonyms ?? []).find((s) => matchesProductSearch(s, nq));
        if (syn) out.push({ key: p.id, p, hint: syn, score: 2 });
      }
      for (const v of p.variants ?? []) {
        if (matchesProductSearch(v, nq) || (p.variantSynonyms?.[v] ?? []).some((s) => matchesProductSearch(s, nq)))
          out.push({ key: `${p.id}|${v}`, p, variant: v, score: 3 });
      }
      if (out.length > 200) break;
    }
    return out.sort((a, b) => a.score - b.score || a.p.name.length - b.p.name.length).slice(0, 12);
  }, [nq, catalog.products]);

  const add = (r: (typeof results)[number]) => {
    const g = depts.get(r.p.departmentId);
    const name = r.variant ? `${r.p.name} · ${r.variant}` : r.p.name;
    const vi = r.variant ? r.p.variantImages?.[r.variant] : undefined;
    onAdd({
      productId: r.p.id, departmentId: r.p.departmentId, name,
      quantity: formatQuantity(r.p.defaultQuantity, r.p.defaultUnit), unit: r.p.defaultUnit,
      organic: false, emoji: r.p.emoji, imageUrl: vi?.imageUrl ?? r.p.imageUrl,
      groupLabel: g?.name, groupEmoji: g?.emoji ?? undefined,
    });
    toast.success(t("common.addedToList", { name }));
  };

  return (
    <div className="relative">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== "Enter" || !q.trim()) return;
          if (results[0]) add(results[0]); else { onAddFree(q.trim()); toast.success(t("common.addedToList", { name: q.trim() })); }
          setQ("");
        }}
        placeholder={t("gs.placeholder")}
        aria-label={t("gs.placeholder")}
        className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
      />
      {nq.length >= 2 && (
        <ul className="absolute left-0 right-0 top-full z-30 mt-1 max-h-80 overflow-y-auto rounded-2xl border border-border bg-card shadow-lg">
          {results.map((r) => (
            <li key={r.key} className="flex items-center gap-3 border-b border-border px-3 py-2 last:border-0">
              <ProductIcon product={r.p} className="h-8 w-8" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{r.p.name}{r.variant && ` · ${r.variant}`}</p>
                <p className="truncate text-xs text-muted-foreground">{r.hint ? `„${r.hint}" · ` : ""}{depts.get(r.p.departmentId)?.name}</p>
              </div>
              <button onClick={() => add(r)} aria-label={t("dlg.addToList")} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground active:scale-95">
                <PlusIcon className="h-4 w-4" />
              </button>
            </li>
          ))}
          <li className="flex items-center gap-3 px-3 py-2">
            <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{t("gs.addFree", { name: q.trim() })}</p>
            <button onClick={() => { onAddFree(q.trim()); toast.success(t("common.addedToList", { name: q.trim() })); setQ(""); }} aria-label={t("gs.addFree", { name: q.trim() })} className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-primary text-primary active:scale-95">
              <PlusIcon className="h-4 w-4" />
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
