import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { scanImportUrl, acceptImportCandidates, rejectImportCandidates } from "@/lib/import.functions";
import { getLocale, translate } from "@/i18n";
import type { MessageKey } from "@/i18n/de";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMarketCodes } from "@/hooks/use-markets";
import { flagOf } from "@/lib/catalog-query";

const T = (key: MessageKey, vars?: Record<string, string | number>) => translate(getLocale(), key, vars);

type Dept = { id: string; name: string; parent_id: string | null };
type Prod = { id: string; name: string };
type Cand = {
  id: string; raw_name: string; suggested_name: string; department_id: string | null; emoji: string | null;
  price: number | null; currency: string | null; unit_price: number | null; unit_basis: string | null;
  match_product_id: string | null; match_type: string; market: string;
};
type Source = { id: string; name: string; url: string; market: string; interval: string; enabled: boolean; last_run_at: string | null; last_status: string | null };
type Edit = { on: boolean; action: "create" | "link"; name: string; dept: string; emoji: string; price: string };

export function ImportPanel({ depts, prods }: { depts: Dept[]; prods: Prod[] }) {
  const MARKETS = useMarketCodes();
  const qc = useQueryClient();
  const scan = useServerFn(scanImportUrl);
  const accept = useServerFn(acceptImportCandidates);
  const reject = useServerFn(rejectImportCandidates);
  const [url, setUrl] = useState("");
  const [market, setMarket] = useState(getLocale().split("-")[1] ?? "CH");
  const [busy, setBusy] = useState(false);
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const prodName = useMemo(() => new Map(prods.map((p) => [p.id, p.name])), [prods]);

  const cands = useQuery({
    queryKey: ["import-candidates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("import_candidates").select("*").eq("status", "pending").order("created_at", { ascending: false }).limit(300);
      if (error) throw error;
      return data as Cand[];
    },
  });
  const sources = useQuery({
    queryKey: ["import-sources"],
    queryFn: async () => {
      const { data, error } = await supabase.from("import_sources").select("*").order("created_at");
      if (error) throw error;
      return data as Source[];
    },
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["import-candidates"] }); qc.invalidateQueries({ queryKey: ["import-sources"] }); };

  const edit = (c: Cand): Edit => edits[c.id] ?? {
    on: true, action: c.match_type === "similar" ? "link" : "create", name: c.suggested_name,
    dept: c.department_id ?? "", emoji: c.emoji ?? "", price: c.price != null ? String(c.price) : "",
  };
  const setEdit = (c: Cand, patch: Partial<Edit>) => setEdits((e) => ({ ...e, [c.id]: { ...edit(c), ...patch } }));

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  const doScan = (u: string, m: string, sourceId: string | null) => run(async () => {
    const r = await scan({ data: { url: u, market: m, sourceId } });
    toast.success(T("imp.scanDone", { found: r.found, pending: r.pending, priced: r.priced }));
    refresh();
  });

  const saveSource = () => run(async () => {
    const name = new URL(url).hostname.replace(/^www\./, "");
    const { error } = await supabase.from("import_sources").insert({ name, url, market, interval: "weekly" });
    if (error) throw error;
    toast.success(T("imp.sourceSaved"));
    refresh();
  });

  const list = cands.data ?? [];
  const selected = list.filter((c) => edit(c).on);

  const saveSelected = () => run(async () => {
    const items = selected.map((c) => {
      const e = edit(c);
      const action = e.action === "link" && c.match_product_id ? "link" as const : "create" as const;
      return { id: c.id, action, name: e.name, department_id: e.dept || null, emoji: e.emoji || null, price: e.price ? Number(e.price) : null };
    });
    const missing = items.find((i) => i.action === "create" && !i.department_id);
    if (missing) throw new Error(T("imp.needDept", { name: missing.name }));
    const r = await accept({ data: { items } });
    toast.success(T("imp.saved", { created: r.created, linked: r.linked }));
    setEdits({});
    refresh();
    qc.invalidateQueries();
  });

  const rejectSelected = () => run(async () => {
    await reject({ data: { ids: selected.map((c) => c.id) } });
    setEdits({});
    refresh();
  });

  const deptOptions = useMemo(() => {
    const byId = new Map(depts.map((d) => [d.id, d]));
    const label = (d: Dept) => (d.parent_id && byId.get(d.parent_id) ? `${byId.get(d.parent_id)!.name} › ` : "") + d.name;
    return depts.map((d) => ({ id: d.id, label: label(d) })).sort((a, b) => a.label.localeCompare(b.label));
  }, [depts]);

  const chip = (t: string) => t === "similar"
    ? <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">{T("imp.similar")}</span>
    : <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">{T("imp.new")}</span>;

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">{T("imp.title")}</h2>
        {list.length > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">{list.length}</span>}
      </div>
      <p className="text-xs text-muted-foreground">{T("imp.hint")}</p>

      <div className="flex gap-2">
        <select value={market} onChange={(e) => setMarket(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-2 text-sm">
          {MARKETS.map((m) => <option key={m} value={m}>{flagOf(m)} {m}</option>)}
        </select>
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="h-10" />
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" disabled={busy || !/^https?:\/\//.test(url)} onClick={() => doScan(url, market, null)}>{busy ? T("adm.working") : T("imp.scan")}</Button>
        <Button variant="outline" disabled={busy || !/^https?:\/\//.test(url)} onClick={saveSource}>{T("imp.saveSource")}</Button>
      </div>

      {list.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{T("imp.pending", { n: list.length })}</span>
            <button className="font-semibold text-primary" onClick={() => setEdits(Object.fromEntries(list.map((c) => [c.id, { ...edit(c), on: !(selected.length === list.length) }])))}>
              {selected.length === list.length ? T("imp.none") : T("imp.all")}
            </button>
          </div>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {list.map((c) => {
              const e = edit(c);
              return (
                <div key={c.id} className={`space-y-1.5 rounded-xl border border-border p-2.5 ${e.on ? "" : "opacity-50"}`}>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={e.on} onChange={(ev) => setEdit(c, { on: ev.target.checked })} className="h-4 w-4 accent-primary" />
                    <Input value={e.emoji} onChange={(ev) => setEdit(c, { emoji: ev.target.value })} className="h-8 w-11 px-1 text-center" />
                    <Input value={e.name} onChange={(ev) => setEdit(c, { name: ev.target.value })} className="h-8 flex-1" />
                    {chip(c.match_type)}
                  </div>
                  <p className="truncate pl-6 text-[11px] text-muted-foreground">{c.raw_name}{c.unit_price != null ? ` · ${c.unit_price} ${c.currency}/${c.unit_basis}` : ""}</p>
                  {c.match_type === "similar" && c.match_product_id && (
                    <div className="flex gap-3 pl-6 text-xs">
                      <label className="flex items-center gap-1"><input type="radio" checked={e.action === "link"} onChange={() => setEdit(c, { action: "link" })} />{T("imp.same", { name: prodName.get(c.match_product_id) ?? "?" })}</label>
                      <label className="flex items-center gap-1"><input type="radio" checked={e.action === "create"} onChange={() => setEdit(c, { action: "create" })} />{T("imp.createNew")}</label>
                    </div>
                  )}
                  <div className="flex gap-2 pl-6">
                    {e.action === "create" && (
                      <select value={e.dept} onChange={(ev) => setEdit(c, { dept: ev.target.value })} className="h-8 min-w-0 flex-1 rounded-lg border border-border bg-background px-1 text-xs">
                        <option value="">{T("imp.chooseDept")}</option>
                        {deptOptions.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
                      </select>
                    )}
                    <div className="flex items-center gap-1">
                      <Input value={e.price} onChange={(ev) => setEdit(c, { price: ev.target.value.replace(",", ".") })} inputMode="decimal" className="h-8 w-20 text-xs" placeholder={T("imp.price")} />
                      <span className="text-[11px] text-muted-foreground">{c.currency}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" disabled={busy || selected.length === 0} onClick={saveSelected}>{T("imp.saveSelected", { n: selected.length })}</Button>
            <Button variant="outline" disabled={busy || selected.length === 0} onClick={rejectSelected}>{T("imp.reject")}</Button>
          </div>
        </div>
      )}

      <div className="space-y-2 border-t border-border pt-3">
        <h3 className="text-sm font-bold text-foreground">{T("imp.sources")}</h3>
        <p className="text-xs text-muted-foreground">{T("imp.sourcesHint")}</p>
        {(sources.data ?? []).length === 0 && <p className="text-xs text-muted-foreground">{T("imp.noSources")}</p>}
        {(sources.data ?? []).map((s) => (
          <div key={s.id} className="space-y-1 rounded-xl border border-border p-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span>{flagOf(s.market)}</span>
              <span className="min-w-0 flex-1 truncate font-semibold text-foreground">{s.name}</span>
              <select value={s.interval} onChange={async (ev) => { await supabase.from("import_sources").update({ interval: ev.target.value }).eq("id", s.id); refresh(); }} className="h-7 rounded border border-border bg-background px-1">
                <option value="daily">{T("imp.daily")}</option>
                <option value="weekly">{T("imp.weekly")}</option>
              </select>
              <input type="checkbox" checked={s.enabled} aria-label={T("imp.enabled")} onChange={async (ev) => { await supabase.from("import_sources").update({ enabled: ev.target.checked }).eq("id", s.id); refresh(); }} className="h-4 w-4 accent-primary" />
            </div>
            <p className="truncate text-muted-foreground">{s.url}</p>
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{s.last_run_at ? `${new Date(s.last_run_at).toLocaleString(getLocale())} · ${s.last_status ?? ""}` : T("imp.neverRun")}</span>
              <button className="font-semibold text-primary" disabled={busy} onClick={() => doScan(s.url, s.market, s.id)}>{T("imp.runNow")}</button>
              <button className="font-semibold text-destructive" onClick={async () => { if (!confirm(T("imp.deleteSource"))) return; await supabase.from("import_sources").delete().eq("id", s.id); refresh(); }}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
