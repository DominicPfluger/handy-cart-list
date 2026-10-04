import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getLocale, translate } from "@/i18n";
import type { MessageKey } from "@/i18n/de";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { marketsQuery, type MarketRow } from "@/hooks/use-markets";

const T = (key: MessageKey, vars?: Record<string, string | number>) => translate(getLocale(), key, vars);
type Shop = { id: string; market_code: string; name: string; emoji: string | null; enabled: boolean; sort_order: number };

function check(r: { error: { message: string } | null }) {
  if (r.error) { toast.error(r.error.message); return false; }
  return true;
}

/** Länder-Märkte und Supermärkte pro Land verwalten. */
export function MarketsManager() {
  const qc = useQueryClient();
  const { data: markets = [] } = useQuery(marketsQuery);
  const { data: shops = [] } = useQuery({
    queryKey: ["supermarkets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("supermarkets").select("*").order("sort_order");
      if (error) throw new Error(error.message);
      return (data ?? []) as Shop[];
    },
  });
  const [open, setOpen] = useState<string | null>(null);
  const [edit, setEdit] = useState<string | null>(null);
  const [form, setForm] = useState({ code: "", name: "", flag: "", currency: "" });
  const [shopName, setShopName] = useState("");
  const [shopEmoji, setShopEmoji] = useState("");
  const [drag, setDrag] = useState<{ kind: "m" | "s"; id: string } | null>(null);

  const refresh = () => { qc.invalidateQueries({ queryKey: ["markets"] }); qc.invalidateQueries({ queryKey: ["supermarkets"] }); };

  const saveMarket = async () => {
    const code = form.code.trim().toUpperCase();
    if (!code || !form.name.trim()) return;
    const row = { code, name: form.name.trim(), flag: form.flag.trim(), currency: form.currency.trim().toUpperCase() || "EUR" };
    const r = edit
      ? await supabase.from("markets").update(row).eq("code", edit)
      : await supabase.from("markets").insert({ ...row, sort_order: markets.length + 1 });
    if (!check(r)) return;
    setForm({ code: "", name: "", flag: "", currency: "" }); setEdit(null); refresh();
  };
  const toggleMarket = async (m: MarketRow) => { if (check(await supabase.from("markets").update({ enabled: !m.enabled }).eq("code", m.code))) refresh(); };
  const delMarket = async (m: MarketRow) => {
    if (!confirm(T("mkt.confirmDel", { n: m.name }))) return;
    if (check(await supabase.from("markets").delete().eq("code", m.code))) refresh();
  };
  const addShop = async (code: string) => {
    const n = shopName.trim(); if (!n) return;
    const count = shops.filter((s) => s.market_code === code).length;
    if (check(await supabase.from("supermarkets").insert({ market_code: code, name: n, emoji: shopEmoji.trim() || null, sort_order: count + 1 }))) { setShopName(""); setShopEmoji(""); refresh(); }
  };
  const editShopEmoji = async (s: Shop) => {
    const e = prompt(T("mkt.emoji"), s.emoji ?? "")?.trim();
    if (e === undefined || e === (s.emoji ?? "")) return;
    if (check(await supabase.from("supermarkets").update({ emoji: e || null }).eq("id", s.id))) refresh();
  };
  const renameShop = async (s: Shop) => {
    const n = prompt(T("mkt.rename"), s.name)?.trim(); if (!n || n === s.name) return;
    if (check(await supabase.from("supermarkets").update({ name: n }).eq("id", s.id))) refresh();
  };
  const toggleShop = async (s: Shop) => { if (check(await supabase.from("supermarkets").update({ enabled: !s.enabled }).eq("id", s.id))) refresh(); };
  const delShop = async (s: Shop) => {
    if (!confirm(T("mkt.confirmDel", { n: s.name }))) return;
    if (check(await supabase.from("supermarkets").delete().eq("id", s.id))) refresh();
  };

  const reorder = async (kind: "m" | "s", targetId: string) => {
    if (!drag || drag.kind !== kind || drag.id === targetId) return;
    if (kind === "m") {
      const list = [...markets]; const from = list.findIndex((x) => x.code === drag.id); const to = list.findIndex((x) => x.code === targetId);
      const [it] = list.splice(from, 1); list.splice(to, 0, it!);
      await Promise.all(list.map((x, i) => supabase.from("markets").update({ sort_order: i + 1 }).eq("code", x.code)));
    } else {
      const src = shops.find((x) => x.id === drag.id); if (!src) return;
      const list = shops.filter((x) => x.market_code === src.market_code);
      const from = list.findIndex((x) => x.id === drag.id); const to = list.findIndex((x) => x.id === targetId);
      if (to < 0) return;
      const [it] = list.splice(from, 1); list.splice(to, 0, it!);
      await Promise.all(list.map((x, i) => supabase.from("supermarkets").update({ sort_order: i + 1 }).eq("id", x.id)));
    }
    refresh();
  };

  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-3">
      <h2 className="text-base font-bold text-foreground">🏪 {T("mkt.title")}</h2>
      <ul className="space-y-1.5">
        {markets.map((m) => {
          const list = shops.filter((s) => s.market_code === m.code);
          return (
            <li key={m.code} draggable onDragStart={() => setDrag({ kind: "m", id: m.code })} onDragOver={(e) => e.preventDefault()}
              onDrop={() => reorder("m", m.code)} onDragEnd={() => setDrag(null)}
              className={`rounded-lg border border-border ${m.enabled ? "" : "opacity-50"}`}>
              <div className="flex items-center gap-2 px-2 py-2">
                <span className="cursor-grab text-muted-foreground">⠿</span>
                <button type="button" className="flex flex-1 items-center gap-2 text-left text-sm" onClick={() => setOpen(open === m.code ? null : m.code)}>
                  <span className="text-lg">{m.flag}</span><span className="font-semibold">{m.code}</span>
                  <span className="text-foreground">{m.name}</span><span className="text-xs text-muted-foreground">{m.currency} · {list.length}</span>
                </button>
                <button type="button" aria-label={T("mkt.toggle")} onClick={() => toggleMarket(m)} className="text-sm">{m.enabled ? "👁" : "🚫"}</button>
                <button type="button" aria-label={T("mkt.edit")} onClick={() => { setEdit(m.code); setForm({ code: m.code, name: m.name, flag: m.flag, currency: m.currency }); }} className="text-sm">✎</button>
                <button type="button" aria-label={T("mkt.delete")} onClick={() => delMarket(m)} className="text-sm text-destructive">✕</button>
              </div>
              {open === m.code && (
                <div className="space-y-1.5 border-t border-border px-3 py-2">
                  {list.map((s) => (
                    <div key={s.id} draggable onDragStart={(e) => { e.stopPropagation(); setDrag({ kind: "s", id: s.id }); }} onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.stopPropagation(); reorder("s", s.id); }} onDragEnd={() => setDrag(null)}
                      className={`flex items-center gap-2 text-sm ${s.enabled ? "" : "opacity-50"}`}>
                      <span className="cursor-grab text-muted-foreground">⠿</span>
                      <button type="button" className="flex-1 text-left" onClick={() => renameShop(s)}>{s.emoji ? `${s.emoji} ` : ""}{s.name}</button>
                      <button type="button" aria-label={T("mkt.emoji")} title={T("mkt.emoji")} onClick={() => editShopEmoji(s)} className="text-sm">✎</button>
                      <button type="button" onClick={() => toggleShop(s)}>{s.enabled ? "👁" : "🚫"}</button>
                      <button type="button" className="text-destructive" onClick={() => delShop(s)}>✕</button>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <Input value={shopEmoji} onChange={(e) => setShopEmoji(e.target.value)} placeholder="🏪" maxLength={4} aria-label={T("mkt.emoji")} className="h-9 w-14 text-center" />
                    <Input value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder={T("mkt.shopName")} className="h-9"
                      onKeyDown={(e) => { if (e.key === "Enter") addShop(m.code); }} />
                    <Button size="sm" variant="outline" onClick={() => addShop(m.code)}>+ {T("mkt.addShop")}</Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Input value={form.flag} onChange={(e) => setForm({ ...form, flag: e.target.value })} placeholder="🏳️" className="h-9" />
        <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder={T("mkt.code")} className="h-9" maxLength={3} />
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={T("mkt.name")} className="h-9" />
        <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} placeholder={T("mkt.currency")} className="h-9" maxLength={3} />
        <div className="flex gap-1">
          <Button size="sm" onClick={saveMarket} className="flex-1">{edit ? T("mkt.save") : `+ ${T("mkt.addMarket")}`}</Button>
          {edit && <Button size="sm" variant="ghost" onClick={() => { setEdit(null); setForm({ code: "", name: "", flag: "", currency: "" }); }}>✕</Button>}
        </div>
      </div>
    </section>
  );
}
