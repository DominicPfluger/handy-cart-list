import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { addStoreAdmin } from "@/lib/admin.functions";
import { flagOf } from "@/lib/catalog-query";
import { getLocale, translate } from "@/i18n";
import type { MessageKey } from "@/i18n/de";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const T = (key: MessageKey) => translate(getLocale(), key);

type Store = { id: string; name: string; emoji: string | null; market_code: string };
type Dept = { id: string; name: string; emoji: string | null; parent_id: string | null; sort_order: number };
type Prod = { id: string; name: string; emoji: string | null; default_quantity: number; default_unit: string; sort_order: number };
type DOv = { department_id: string; name: string | null; sort_order: number | null; hidden: boolean };
type POv = { product_id: string; name: string | null; emoji: string | null; default_quantity: number | null; default_unit: string | null; sort_order: number | null; hidden: boolean };

function useStoresList(storeIds?: string[]) {
  return useQuery({
    queryKey: ["st-stores", storeIds?.join(",") ?? "all"],
    queryFn: async () => {
      let q = supabase.from("supermarkets").select("id, name, emoji, market_code").order("market_code").order("sort_order");
      if (storeIds) q = q.in("id", storeIds.length ? storeIds : ["00000000-0000-0000-0000-000000000000"]);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return (data ?? []) as Store[];
    },
  });
}

const storeLabel = (s: Store) => `${flagOf(s.market_code)} ${s.emoji ?? ""} ${s.name}`.replace(/\s+/g, " ");

/** Katalog-Abweichungen pro Laden: Kategorien & Produkte umsortieren, umbenennen, ausblenden, ändern. */
export function StoreCatalogAdmin({ storeIds }: { storeIds?: string[] }) {
  const qc = useQueryClient();
  const stores = useStoresList(storeIds);
  const [storeSel, setStore] = useState("");
  const store = storeSel || stores.data?.[0]?.id || "";
  const [cur, setCur] = useState<string | null>(null);

  const depts = useQuery({
    queryKey: ["st-depts"],
    queryFn: async () => ((await supabase.from("departments").select("id, name, emoji, parent_id, sort_order")).data ?? []) as Dept[],
  });
  const prods = useQuery({
    queryKey: ["st-prods", cur],
    enabled: Boolean(cur),
    queryFn: async () => ((await supabase.from("products").select("id, name, emoji, default_quantity, default_unit, sort_order").eq("department_id", cur!)).data ?? []) as Prod[],
  });
  const ov = useQuery({
    queryKey: ["st-ov", store],
    enabled: Boolean(store),
    queryFn: async () => {
      const [d, p] = await Promise.all([
        supabase.from("store_department_overrides").select("department_id, name, sort_order, hidden").eq("supermarket_id", store),
        supabase.from("store_product_overrides").select("product_id, name, emoji, default_quantity, default_unit, sort_order, hidden").eq("supermarket_id", store),
      ]);
      return {
        d: new Map(((d.data ?? []) as DOv[]).map((r) => [r.department_id, r])),
        p: new Map(((p.data ?? []) as POv[]).map((r) => [r.product_id, r])),
      };
    },
  });
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["st-ov", store] }); void qc.invalidateQueries({ queryKey: ["store-overrides"] }); };

  const childDepts = useMemo(() => {
    const list = (depts.data ?? []).filter((d) => d.parent_id === cur);
    const o = ov.data?.d;
    return list.map((d) => ({ ...d, o: o?.get(d.id) })).sort((a, b) => (a.o?.sort_order ?? a.sort_order) - (b.o?.sort_order ?? b.sort_order) || a.name.localeCompare(b.name, "de"));
  }, [depts.data, cur, ov.data]);
  const prodList = useMemo(() => {
    const o = ov.data?.p;
    return (prods.data ?? []).map((p) => ({ ...p, o: o?.get(p.id) })).sort((a, b) => (a.o?.sort_order ?? a.sort_order) - (b.o?.sort_order ?? b.sort_order) || a.name.localeCompare(b.name, "de"));
  }, [prods.data, ov.data]);

  const crumbs = useMemo(() => {
    const byId = new Map((depts.data ?? []).map((d) => [d.id, d]));
    const out: Dept[] = [];
    let c = cur ? byId.get(cur) : undefined;
    while (c) { out.unshift(c); c = c.parent_id ? byId.get(c.parent_id) : undefined; }
    return out;
  }, [depts.data, cur]);

  const upD = async (rows: Array<Partial<DOv> & { department_id: string }>) => {
    const r = await supabase.from("store_department_overrides").upsert(rows.map((x) => ({ ...x, supermarket_id: store })), { onConflict: "supermarket_id,department_id" });
    if (r.error) toast.error(r.error.message); else refresh();
  };
  const upP = async (rows: Array<Partial<POv> & { product_id: string }>) => {
    const r = await supabase.from("store_product_overrides").upsert(rows.map((x) => ({ ...x, supermarket_id: store })), { onConflict: "supermarket_id,product_id" });
    if (r.error) toast.error(r.error.message); else refresh();
  };
  const resetD = async (id: string) => { const r = await supabase.from("store_department_overrides").delete().eq("supermarket_id", store).eq("department_id", id); if (r.error) toast.error(r.error.message); else refresh(); };
  const resetP = async (id: string) => { const r = await supabase.from("store_product_overrides").delete().eq("supermarket_id", store).eq("product_id", id); if (r.error) toast.error(r.error.message); else refresh(); };

  const moveD = (i: number, dir: -1 | 1) => {
    const j = i + dir; if (j < 0 || j >= childDepts.length) return;
    const ids = childDepts.map((d) => d.id); [ids[i], ids[j]] = [ids[j]!, ids[i]!];
    void upD(ids.map((id, k) => ({ department_id: id, sort_order: k * 10 })));
  };
  const moveP = (i: number, dir: -1 | 1) => {
    const j = i + dir; if (j < 0 || j >= prodList.length) return;
    const ids = prodList.map((p) => p.id); [ids[i], ids[j]] = [ids[j]!, ids[i]!];
    void upP(ids.map((id, k) => ({ product_id: id, sort_order: k * 10 })));
  };

  if (stores.isLoading) return <p className="text-sm text-muted-foreground">…</p>;
  if (!stores.data?.length) return <p className="text-sm text-muted-foreground">{T("st.noStores")}</p>;

  const rowCls = (hidden?: boolean) => `flex items-center gap-1.5 px-2 py-1.5 text-sm ${hidden ? "opacity-50" : ""}`;
  const arrows = (i: number, len: number, mv: (i: number, d: -1 | 1) => void) => (
    <span className="flex shrink-0 flex-col">
      <button type="button" disabled={i === 0} onClick={() => mv(i, -1)} className="px-1 text-xs leading-none disabled:opacity-30" aria-label="↑">▲</button>
      <button type="button" disabled={i === len - 1} onClick={() => mv(i, 1)} className="px-1 text-xs leading-none disabled:opacity-30" aria-label="↓">▼</button>
    </span>
  );

  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-3">
      <h2 className="text-base font-bold text-foreground">🏪 {T("st.title")}</h2>
      <p className="text-xs text-muted-foreground">{T("st.hint")}</p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm font-medium">{T("st.store")}</label>
        <select value={store} onChange={(e) => setStore(e.target.value)} className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-2 text-sm">
          {stores.data.map((s) => <option key={s.id} value={s.id}>{storeLabel(s)}</option>)}
        </select>
      </div>


      <nav className="flex flex-wrap items-center gap-1 text-sm">
        <button type="button" className="font-semibold text-primary" onClick={() => setCur(null)}>{T("st.root")}</button>
        {crumbs.map((c) => <span key={c.id}> › <button type="button" className="font-semibold text-primary" onClick={() => setCur(c.id)}>{ov.data?.d.get(c.id)?.name ?? c.name}</button></span>)}
      </nav>

      {childDepts.length > 0 && (<div>
        <h3 className="mb-1 text-sm font-semibold">{T("st.categories")}</h3>
        <ul className="divide-y divide-border rounded-lg border border-border">
          {childDepts.map((d, i) => (
            <li key={d.id} className={rowCls(d.o?.hidden)}>
              {arrows(i, childDepts.length, moveD)}
              <span className="w-6 text-center">{d.emoji}</span>
              <Input key={`${store}-${d.id}-${d.o?.name ?? ""}`} defaultValue={d.o?.name ?? ""} placeholder={d.name} className="h-8 min-w-0 flex-1"
                onBlur={(e) => { const v = e.target.value.trim() || null; if (v !== (d.o?.name ?? null)) void upD([{ department_id: d.id, name: v }]); }} />
              <Button variant="outline" size="sm" onClick={() => setCur(d.id)}>{T("st.open")}</Button>
              <Button variant="outline" size="sm" onClick={() => upD([{ department_id: d.id, hidden: !d.o?.hidden }])}>{d.o?.hidden ? T("st.show") : T("st.hide")}</Button>
              {d.o && <Button variant="outline" size="sm" onClick={() => resetD(d.id)} title={T("st.reset")}>↺</Button>}
            </li>
          ))}
        </ul>
      </div>)}

      {cur && prodList.length > 0 && (<div>
        <h3 className="mb-1 text-sm font-semibold">{T("st.products")}</h3>
        <ul className="divide-y divide-border rounded-lg border border-border">
          {prodList.map((p, i) => (
            <li key={p.id} className={`${rowCls(p.o?.hidden)} flex-wrap`}>
              {arrows(i, prodList.length, moveP)}
              <Input key={`e-${store}-${p.id}-${p.o?.emoji ?? ""}`} defaultValue={p.o?.emoji ?? ""} placeholder={p.emoji ?? ""} className="h-8 w-12 text-center"
                onBlur={(e) => { const v = e.target.value.trim() || null; if (v !== (p.o?.emoji ?? null)) void upP([{ product_id: p.id, emoji: v }]); }} />
              <Input key={`n-${store}-${p.id}-${p.o?.name ?? ""}`} defaultValue={p.o?.name ?? ""} placeholder={p.name} className="h-8 min-w-0 flex-1"
                onBlur={(e) => { const v = e.target.value.trim() || null; if (v !== (p.o?.name ?? null)) void upP([{ product_id: p.id, name: v }]); }} />
              <Input key={`q-${store}-${p.id}-${p.o?.default_quantity ?? ""}`} type="number" defaultValue={p.o?.default_quantity ?? ""} placeholder={String(p.default_quantity)} className="h-8 w-16"
                onBlur={(e) => { const v = e.target.value === "" ? null : Number(e.target.value); if (v !== (p.o?.default_quantity ?? null)) void upP([{ product_id: p.id, default_quantity: v }]); }} />
              <Input key={`u-${store}-${p.id}-${p.o?.default_unit ?? ""}`} defaultValue={p.o?.default_unit ?? ""} placeholder={p.default_unit} className="h-8 w-20"
                onBlur={(e) => { const v = e.target.value.trim() || null; if (v !== (p.o?.default_unit ?? null)) void upP([{ product_id: p.id, default_unit: v }]); }} />
              <Button variant="outline" size="sm" onClick={() => upP([{ product_id: p.id, hidden: !p.o?.hidden }])}>{p.o?.hidden ? T("st.show") : T("st.hide")}</Button>
              {p.o && <Button variant="outline" size="sm" onClick={() => resetP(p.id)} title={T("st.reset")}>↺</Button>}
            </li>
          ))}
        </ul>
      </div>)}
    </section>
  );
}

/** Laden-Admins per E-Mail zuweisen und entfernen (nur Haupt-Admin). */
export function StoreAdminsManager() {
  const qc = useQueryClient();
  const add = useServerFn(addStoreAdmin);
  const stores = useStoresList();
  const [email, setEmail] = useState("");
  const [storeSel, setStore] = useState("");
  const store = storeSel || stores.data?.[0]?.id || "";
  const q = useQuery({
    queryKey: ["st-admins"],
    queryFn: async () => ((await supabase.from("store_admins").select("id, email, supermarket_id").order("created_at")).data ?? []),
  });
  const byId = new Map((stores.data ?? []).map((s) => [s.id, s]));
  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-3">
      <h2 className="text-base font-bold text-foreground">🏪 {T("st.admins")}</h2>
      <form className="flex flex-wrap gap-2" onSubmit={async (e) => {
        e.preventDefault();
        try { await add({ data: { email, supermarketId: store } }); setEmail(""); toast.success(T("st.adminAdded")); void qc.invalidateQueries({ queryKey: ["st-admins"] }); }
        catch (err) { toast.error((err as Error).message); }
      }}>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-Mail" className="h-10 min-w-0 flex-1" />
        <select value={store} onChange={(e) => setStore(e.target.value)} className="h-10 rounded-lg border border-input bg-background px-2 text-sm">
          {(stores.data ?? []).map((s) => <option key={s.id} value={s.id}>{storeLabel(s)}</option>)}
        </select>
        <Button type="submit" disabled={!email || !store}>+</Button>
      </form>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {(q.data ?? []).length === 0 && <li className="px-2 py-2 text-sm text-muted-foreground">{T("st.noAdmins")}</li>}
        {(q.data ?? []).map((a) => {
          const s = byId.get(a.supermarket_id);
          return (
            <li key={a.id} className="flex items-center gap-2 px-2 py-1.5 text-sm">
              <span className="shrink-0">{s ? storeLabel(s) : "?"}</span>
              <span className="min-w-0 flex-1 truncate">{a.email}</span>
              <button type="button" className="px-1 text-xs text-destructive" onClick={async () => {
                const r = await supabase.from("store_admins").delete().eq("id", a.id);
                if (r.error) toast.error(r.error.message); else void qc.invalidateQueries({ queryKey: ["st-admins"] });
              }}>✕</button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
