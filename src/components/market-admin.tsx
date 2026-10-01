import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { addMarketAdmin, rankProducts, translateMarketProduct } from "@/lib/admin.functions";
import { LOCALES, getLocale, translate } from "@/i18n";
import type { MessageKey } from "@/i18n/de";
import { flagOf } from "@/lib/catalog-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const T = (key: MessageKey, vars?: Record<string, string | number>) => translate(getLocale(), key, vars);
export const MARKETS = [...new Set(LOCALES.map((l) => l.id.split("-")[1]!))];

type Dept = { id: string; name: string; parent_id: string | null; sort_order: number };
type P = { id: string; name: string; emoji: string | null; markets: string[]; sort_order: number };

function must<T extends { error: { message: string } | null }>(r: T): T {
  if (r.error) throw new Error(r.error.message);
  return r;
}

/** Markt-spezifische Pflege: Marktprodukte, Ausblenden, Sortierung. */
export function MarketAdmin({ markets }: { markets: string[] }) {
  const qc = useQueryClient();
  const tr = useServerFn(translateMarketProduct);
  const [market, setMarket] = useState(markets[0] ?? "CH");
  const [dept, setDept] = useState("");
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [busy, setBusy] = useState(false);

  const depts = useQuery({
    queryKey: ["mk-depts"],
    queryFn: async () => (must(await supabase.from("departments").select("id, name, parent_id, sort_order")).data ?? []) as Dept[],
  });
  const options = useMemo(() => {
    const all = depts.data ?? [];
    const byId = new Map(all.map((d) => [d.id, d]));
    const label = (d: Dept): string => (d.parent_id && byId.get(d.parent_id) ? `${label(byId.get(d.parent_id)!)} › ` : "") + d.name;
    return all.map((d) => ({ id: d.id, label: label(d) })).sort((a, b) => a.label.localeCompare(b.label, "de"));
  }, [depts.data]);

  const list = useQuery({
    queryKey: ["mk-list", dept, market],
    enabled: Boolean(dept),
    queryFn: async () => {
      const prods = (must(await supabase.from("products").select("id, name, emoji, markets, sort_order").eq("department_id", dept)).data ?? []) as P[];
      const rel = prods.filter((p) => !p.markets.length || p.markets.includes(market));
      const ids = rel.map((p) => p.id);
      const [ex, ord] = await Promise.all([
        supabase.from("product_market_exclusions").select("product_id").eq("market", market).in("product_id", ids),
        supabase.from("product_market_order").select("product_id, sort_order").eq("market", market).in("product_id", ids),
      ]);
      const hidden = new Set((ex.data ?? []).map((r) => r.product_id));
      const order = new Map((ord.data ?? []).map((r) => [r.product_id, r.sort_order]));
      return rel
        .map((p) => ({ ...p, hidden: hidden.has(p.id), order: order.get(p.id) ?? p.sort_order }))
        .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "de"));
    },
  });

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
      await qc.invalidateQueries({ queryKey: ["mk-list"] });
      void qc.invalidateQueries({ queryKey: ["catalog"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  }

  const items = list.data ?? [];
  const rank = useServerFn(rankProducts);
  const sortRelevance = () => {
    if (items.length < 2 || !confirm(T("mk.sortConfirm", { market }))) return;
    void run(async () => {
      const label = options.find((o) => o.id === dept)?.label ?? "";
      const r = await rank({ data: { path: label, criterion: "popularity", groups: [items.map((p) => p.name)], market } });
      const pool = [...items];
      const next = (r.groups[0] ?? []).map((n) => { const k = pool.findIndex((p) => p.name === n); return k < 0 ? null : pool.splice(k, 1)[0]!; })
        .filter((p): p is NonNullable<typeof p> => p !== null).concat(pool);
      must(await supabase.from("product_market_order").upsert(next.map((p, k) => ({ product_id: p.id, market, sort_order: k + 1 })), { onConflict: "product_id,market" }));
      toast.success(T("mk.sorted"));
    });
  };
  const move = (i: number, dir: -1 | 1) => run(async () => {
    const next = [...items];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j]!, next[i]!];
    must(await supabase.from("product_market_order").upsert(next.map((p, k) => ({ product_id: p.id, market, sort_order: k + 1 })), { onConflict: "product_id,market" }));
  });

  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-3">
      <h2 className="text-base font-bold text-foreground">🌍 {T("mk.title")}</h2>
      <p className="text-xs text-muted-foreground">{T("mk.hint")}</p>
      <div className="flex gap-2">
        <select value={market} onChange={(e) => setMarket(e.target.value)} disabled={markets.length < 2} className="h-10 rounded-lg border border-input bg-background px-2 text-sm">
          {markets.map((m) => <option key={m} value={m}>{flagOf(m)} {m}</option>)}
        </select>
        <select value={dept} onChange={(e) => setDept(e.target.value)} className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-2 text-sm">
          <option value="">{T("mk.pickCategory")}</option>
          {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </div>

      {dept && (
        <>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              void run(async () => {
                const r = must(await supabase.from("products").insert({ department_id: dept, name: name.trim(), emoji: emoji.trim() || null, markets: [market], sort_order: items.length + 1 }).select("id").single());
                setName(""); setEmoji("");
                toast.success(T("mk.added"));
                void tr({ data: { id: r.data!.id } }).then(() => qc.invalidateQueries({ queryKey: ["catalog"] }));
              });
            }}
          >
            <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="🙂" className="h-10 w-14" />
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={T("mk.newProduct")} className="h-10 flex-1" />
            <Button type="submit" disabled={busy || !name.trim()}>+</Button>
          </form>

          {items.length > 1 && (
            <Button size="sm" variant="outline" className="w-full" disabled={busy} onClick={sortRelevance}>
              ↕ {busy ? T("adm.working") : T("mk.sortRelevance")}
            </Button>
          )}
          {list.isLoading && <p className="text-sm text-muted-foreground">{T("adm.loading")}</p>}
          <ul className="divide-y divide-border rounded-lg border border-border">
            {items.map((p, i) => {
              const own = p.markets.length > 0;
              return (
                <li key={p.id} className={`flex items-center gap-2 px-2 py-1.5 text-sm ${p.hidden ? "opacity-50" : ""}`}>
                  <span className="w-6 text-center">{p.emoji}</span>
                  <span className="min-w-0 flex-1 truncate">{p.name}{own ? ` ${flagOf(market)}` : ""}</span>
                  <button type="button" disabled={busy || i === 0} onClick={() => move(i, -1)} className="px-1 text-muted-foreground disabled:opacity-30" aria-label="↑">↑</button>
                  <button type="button" disabled={busy || i === items.length - 1} onClick={() => move(i, 1)} className="px-1 text-muted-foreground disabled:opacity-30" aria-label="↓">↓</button>
                  {own ? (
                    <>
                      <button type="button" disabled={busy} className="px-1 text-xs text-primary" onClick={() => {
                        const n = window.prompt(T("mk.rename"), p.name)?.trim();
                        if (n && n !== p.name) void run(async () => { must(await supabase.from("products").update({ name: n }).eq("id", p.id)); await tr({ data: { id: p.id } }); });
                      }}>✎</button>
                      <button type="button" disabled={busy} className="px-1 text-xs text-destructive" onClick={() => {
                        if (window.confirm(T("mk.confirmDelete", { name: p.name }))) void run(async () => { must(await supabase.from("products").delete().eq("id", p.id)); });
                      }}>✕</button>
                    </>
                  ) : (
                    <button type="button" disabled={busy} className="whitespace-nowrap px-1 text-xs text-primary" onClick={() => run(async () => {
                      if (p.hidden) must(await supabase.from("product_market_exclusions").delete().eq("product_id", p.id).eq("market", market));
                      else must(await supabase.from("product_market_exclusions").insert({ product_id: p.id, market }));
                    })}>{p.hidden ? T("mk.show") : T("mk.hide")}</button>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

/** Haupt-Admin: Markt-Admins zuweisen und entfernen. */
export function MarketAdminsManager() {
  const qc = useQueryClient();
  const add = useServerFn(addMarketAdmin);
  const [email, setEmail] = useState("");
  const [market, setMarket] = useState("CH");
  const q = useQuery({
    queryKey: ["mk-admins"],
    queryFn: async () => (must(await supabase.from("market_admins").select("id, email, market").order("market")).data ?? []),
  });
  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-3">
      <h2 className="text-base font-bold text-foreground">👥 {T("mk.admins")}</h2>
      <form className="flex gap-2" onSubmit={async (e) => {
        e.preventDefault();
        try { await add({ data: { email, market } }); setEmail(""); toast.success(T("mk.adminAdded")); void qc.invalidateQueries({ queryKey: ["mk-admins"] }); }
        catch (err) { toast.error((err as Error).message); }
      }}>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-Mail" className="h-10 min-w-0 flex-1" />
        <select value={market} onChange={(e) => setMarket(e.target.value)} className="h-10 rounded-lg border border-input bg-background px-2 text-sm">
          {MARKETS.map((m) => <option key={m} value={m}>{flagOf(m)} {m}</option>)}
        </select>
        <Button type="submit" disabled={!email}>+</Button>
      </form>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {(q.data ?? []).length === 0 && <li className="px-2 py-2 text-sm text-muted-foreground">{T("mk.noAdmins")}</li>}
        {(q.data ?? []).map((a) => (
          <li key={a.id} className="flex items-center gap-2 px-2 py-1.5 text-sm">
            <span>{flagOf(a.market)} {a.market}</span>
            <span className="min-w-0 flex-1 truncate">{a.email}</span>
            <button type="button" className="px-1 text-xs text-destructive" onClick={async () => {
              const r = await supabase.from("market_admins").delete().eq("id", a.id);
              if (r.error) toast.error(r.error.message); else void qc.invalidateQueries({ queryKey: ["mk-admins"] });
            }}>✕</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
