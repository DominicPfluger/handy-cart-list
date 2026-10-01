import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { saveCuisine, deleteCuisine, suggestCuisineProducts } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Cuisine = { id: string; name: string; emoji: string | null; sort_order: number };
type Link = { product_id: string; cuisine_id: string };
type Dept = { id: string; name: string; parent_id: string | null };
type Prod = { id: string; name: string; department_id: string };

async function loadCuisines() {
  const { data: cuisines } = await supabase.from("cuisines").select("id, name, emoji, sort_order").order("sort_order");
  const links: Link[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await supabase.from("product_cuisines").select("product_id, cuisine_id").order("id").range(f, f + 999);
    links.push(...((data ?? []) as Link[]));
    if (!data || data.length < 1000) break;
  }
  return { cuisines: (cuisines ?? []) as Cuisine[], links };
}

export function useCuisineData() {
  return useQuery({ queryKey: ["admin-cuisines"], queryFn: loadCuisines });
}

async function assign(productIds: string[], cuisineId: string) {
  for (let i = 0; i < productIds.length; i += 500) {
    const rows = productIds.slice(i, i + 500).map((product_id) => ({ product_id, cuisine_id: cuisineId }));
    const { error } = await supabase.from("product_cuisines").upsert(rows, { onConflict: "product_id,cuisine_id", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
  }
}
async function unassign(productIds: string[], cuisineId: string) {
  for (let i = 0; i < productIds.length; i += 200) {
    const { error } = await supabase.from("product_cuisines").delete().eq("cuisine_id", cuisineId).in("product_id", productIds.slice(i, i + 200));
    if (error) throw new Error(error.message);
  }
}

/** Mehrfachauswahl der Küchen im Produkt-Editor. */
export function ProductCuisinePicker({ productId }: { productId: string }) {
  const qc = useQueryClient();
  const { data } = useCuisineData();
  if (!data) return null;
  const mine = new Set(data.links.filter((l) => l.product_id === productId).map((l) => l.cuisine_id));
  const toggle = async (c: Cuisine) => {
    try {
      if (mine.has(c.id)) await unassign([productId], c.id);
      else await assign([productId], c.id);
      await qc.invalidateQueries({ queryKey: ["admin-cuisines"] });
      qc.invalidateQueries({ queryKey: ["catalog"] });
    } catch (e) { toast.error((e as Error).message); }
  };
  return (
    <div className="space-y-1.5">
      <h3 className="text-sm font-semibold text-foreground">Länderküchen</h3>
      <div className="flex flex-wrap gap-1.5">
        {data.cuisines.map((c) => (
          <button key={c.id} type="button" aria-pressed={mine.has(c.id)} onClick={() => toggle(c)}
            className={`rounded-full border px-2.5 py-1 text-xs ${mine.has(c.id) ? "border-primary bg-primary/15 text-foreground" : "border-border bg-background text-muted-foreground"}`}>
            {c.emoji} {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Bereich „Länderküchen" im Admin-Panel: Küchen verwalten und Produkte zuweisen. */
export function CuisineAdmin({ depts, prods }: { depts: Dept[]; prods: Prod[] }) {
  const qc = useQueryClient();
  const { data } = useCuisineData();
  const save = useServerFn(saveCuisine);
  const del = useServerFn(deleteCuisine);
  const suggest = useServerFn(suggestCuisineProducts);
  const [open, setOpen] = useState(false);
  const [selId, setSelId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("");
  const [search, setSearch] = useState("");
  const [deptId, setDeptId] = useState("");
  const [picks, setPicks] = useState<string[] | null>(null);

  const deptById = useMemo(() => new Map(depts.map((d) => [d.id, d])), [depts]);
  const path = (id: string) => {
    const out: string[] = [];
    for (let d = deptById.get(id); d; d = d.parent_id ? deptById.get(d.parent_id) : undefined) out.unshift(d.name);
    return out.join(" › ");
  };
  const deptOptions = useMemo(() => depts.map((d) => ({ id: d.id, label: path(d.id) })).sort((a, b) => a.label.localeCompare(b.label, "de")), [depts]); // eslint-disable-line react-hooks/exhaustive-deps
  const descendants = (id: string) => {
    const set = new Set([id]);
    let grew = true;
    while (grew) { grew = false; for (const d of depts) if (d.parent_id && set.has(d.parent_id) && !set.has(d.id)) { set.add(d.id); grew = true; } }
    return set;
  };

  const sel = data?.cuisines.find((c) => c.id === selId);
  const assigned = useMemo(() => new Set((data?.links ?? []).filter((l) => l.cuisine_id === selId).map((l) => l.product_id)), [data, selId]);
  const counts = useMemo(() => { const m = new Map<string, number>(); for (const l of data?.links ?? []) m.set(l.cuisine_id, (m.get(l.cuisine_id) ?? 0) + 1); return m; }, [data]);
  const assignedProds = prods.filter((p) => assigned.has(p.id)).sort((a, b) => path(a.department_id).localeCompare(path(b.department_id), "de") || a.name.localeCompare(b.name, "de"));
  const hits = search.trim().length >= 2 ? prods.filter((p) => !assigned.has(p.id) && p.name.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 12) : [];

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    setBusy(true);
    try {
      await fn();
      await qc.invalidateQueries({ queryKey: ["admin-cuisines"] });
      qc.invalidateQueries({ queryKey: ["catalog"] });
      if (ok) toast.success(ok);
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  const move = (c: Cuisine, dir: -1 | 1) => run(async () => {
    const list = [...(data?.cuisines ?? [])];
    const i = list.findIndex((x) => x.id === c.id), j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j]!, list[i]!];
    await Promise.all(list.map((x, k) => supabase.from("cuisines").update({ sort_order: k }).eq("id", x.id)));
  });

  return (
    <section className="rounded-xl border border-border bg-card p-3">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between text-left">
        <span className="text-sm font-semibold text-foreground">🌍 Länderküchen</span>
        <span className="text-xs text-muted-foreground">{data?.cuisines.length ?? 0} Küchen {open ? "▲" : "▼"}</span>
      </button>
      {open && data && (
        <div className="mt-3 space-y-3">
          {!sel && (
            <>
              <ul className="space-y-1">
                {data.cuisines.map((c) => (
                  <li key={c.id} className="flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1.5">
                    <button type="button" className="flex-1 text-left text-sm text-foreground" onClick={() => { setSelId(c.id); setPicks(null); setSearch(""); }}>
                      {c.emoji} {c.name} <span className="text-xs text-muted-foreground">· {counts.get(c.id) ?? 0}</span>
                    </button>
                    <button type="button" aria-label="Nach oben" className="px-1 text-muted-foreground" disabled={busy} onClick={() => move(c, -1)}>▲</button>
                    <button type="button" aria-label="Nach unten" className="px-1 text-muted-foreground" disabled={busy} onClick={() => move(c, 1)}>▼</button>
                  </li>
                ))}
              </ul>
              <div className="grid grid-cols-[4rem_1fr_auto] gap-2">
                <Input value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} placeholder="🇵🇹" />
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Neue Küche" />
                <Button disabled={busy || !newName.trim()} onClick={() => run(async () => {
                  await save({ data: { name: newName.trim(), emoji: newEmoji.trim() || null, sortOrder: data.cuisines.length } });
                  setNewName(""); setNewEmoji("");
                }, "Küche angelegt und übersetzt")}>+</Button>
              </div>
            </>
          )}

          {sel && (
            <CuisineDetail key={sel.id} cuisine={sel} busy={busy}
              onBack={() => setSelId(null)}
              onSave={(name, emoji) => run(() => save({ data: { id: sel.id, name, emoji } }), "Gespeichert")}
              onDelete={() => { if (confirm(`Küche „${sel.name}" wirklich löschen? Alle Zuordnungen gehen verloren.`)) run(async () => { await del({ data: { id: sel.id } }); setSelId(null); }, "Gelöscht"); }}
            >
              <div className="space-y-1.5">
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Produkt zuweisen (suchen) …" />
                {hits.map((p) => (
                  <button key={p.id} type="button" disabled={busy} onClick={() => run(() => assign([p.id], sel.id))}
                    className="flex w-full justify-between rounded-lg border border-border bg-background px-2 py-1.5 text-left text-sm">
                    <span className="text-foreground">+ {p.name}</span><span className="truncate pl-2 text-[11px] text-muted-foreground">{path(p.department_id)}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <select value={deptId} onChange={(e) => setDeptId(e.target.value)} className="w-full rounded-lg border border-input bg-background px-2 py-2 text-sm">
                  <option value="">Ganze Kategorie wählen …</option>
                  {deptOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
                {deptId && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => { const ids = prods.filter((p) => descendants(deptId).has(p.department_id)).map((p) => p.id); run(() => assign(ids, sel.id), `${ids.length} Produkte zugewiesen`); }}>Alle zuweisen</Button>
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => { const ids = prods.filter((p) => descendants(deptId).has(p.department_id)).map((p) => p.id); run(() => unassign(ids, sel.id), "Entfernt"); }}>Alle entfernen</Button>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Button size="sm" variant="outline" className="w-full" disabled={busy} onClick={() => run(async () => {
                  const pool = prods.filter((p) => !assigned.has(p.id) && (!deptId || descendants(deptId).has(p.department_id)));
                  const found: string[] = [];
                  for (let i = 0; i < pool.length && i < 1600; i += 400) {
                    const r = await suggest({ data: { cuisine: sel.name, candidates: pool.slice(i, i + 400).map((p) => ({ id: p.id, name: p.name, path: path(p.department_id).slice(0, 200) })) } });
                    found.push(...r.ids);
                  }
                  setPicks(found);
                })}>{busy ? "Arbeite …" : `✨ Automatisch zuordnen${deptId ? " (gewählte Kategorie)" : ""}`}</Button>
                {picks && (
                  <div className="space-y-1 rounded-lg border border-primary/40 p-2">
                    <div className="text-xs text-muted-foreground">{picks.length} Vorschläge – abwählen, was nicht passt:</div>
                    <div className="flex max-h-48 flex-wrap gap-1 overflow-y-auto">
                      {picks.map((id) => (
                        <button key={id} type="button" onClick={() => setPicks(picks.filter((x) => x !== id))} className="rounded-full border border-primary bg-primary/15 px-2 py-0.5 text-xs text-foreground">
                          {prods.find((p) => p.id === id)?.name} ✕
                        </button>
                      ))}
                    </div>
                    <Button size="sm" className="w-full" disabled={busy || !picks.length} onClick={() => run(async () => { await assign(picks, sel.id); setPicks(null); }, "Zugewiesen")}>Übernehmen</Button>
                  </div>
                )}
              </div>

              <div>
                <h3 className="mb-1 text-sm font-semibold text-foreground">Zugewiesen ({assignedProds.length})</h3>
                <ul className="max-h-80 space-y-1 overflow-y-auto">
                  {assignedProds.map((p) => (
                    <li key={p.id} className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1 text-sm">
                      <span className="flex-1 text-foreground">{p.name} <span className="text-[11px] text-muted-foreground">{path(p.department_id)}</span></span>
                      <button type="button" aria-label="Entfernen" className="px-1 text-destructive" disabled={busy} onClick={() => run(() => unassign([p.id], sel.id))}>✕</button>
                    </li>
                  ))}
                </ul>
              </div>
            </CuisineDetail>
          )}
        </div>
      )}
    </section>
  );
}

function CuisineDetail(p: { cuisine: Cuisine; busy: boolean; onBack: () => void; onSave: (name: string, emoji: string | null) => void; onDelete: () => void; children: React.ReactNode }) {
  const [name, setName] = useState(p.cuisine.name);
  const [emoji, setEmoji] = useState(p.cuisine.emoji ?? "");
  return (
    <div className="space-y-3">
      <button type="button" className="text-xs text-primary" onClick={p.onBack}>‹ Alle Küchen</button>
      <div className="grid grid-cols-[4rem_1fr] gap-2">
        <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} />
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" size="sm" disabled={p.busy || !name.trim()} onClick={() => p.onSave(name.trim(), emoji.trim() || null)}>Speichern</Button>
        <Button size="sm" variant="destructive" disabled={p.busy} onClick={p.onDelete}>Löschen</Button>
      </div>
      {p.children}
    </div>
  );
}
