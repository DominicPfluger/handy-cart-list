import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { checkAdmin, translateMissing, saveHeading, deleteHeading } from "@/lib/admin.functions";
import { LOCALES } from "@/i18n";
import { getUnits } from "@/lib/units";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Shoppi — Admin-Panel Katalog" },
      { name: "description", content: "Kategorien, Produkte, Überschriften und Übersetzungen des Shoppi-Katalogs auf einer Seite verwalten." },
      { property: "og:title", content: "Shoppi — Admin-Panel Katalog" },
      { property: "og:description", content: "Kategorien, Produkte, Überschriften und Sprachen verwalten." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

type Kind = "department" | "product" | "heading";
type Dept = { id: string; name: string; emoji: string | null; parent_id: string | null; sort_order: number };
type Prod = { id: string; name: string; emoji: string | null; department_id: string; sort_order: number; default_quantity: number; default_unit: string };
type Head = { id: string; name: string; department_id: string; before_product_id: string };
type Tr = { entity_id: string; locale: string; name: string; is_manual: boolean };
type Sel = { kind: Kind; id: string } | null;

async function paged<T>(fn: (from: number, to: number) => PromiseLike<{ data: T[] | null }>) {
  const all: T[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await fn(f, f + 999);
    all.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return all;
}

async function loadAll() {
  const [depts, prods, heads, trs] = await Promise.all([
    paged<Dept>((a, b) => supabase.from("departments").select("id, name, emoji, parent_id, sort_order").order("sort_order").order("id").range(a, b)),
    paged<Prod>((a, b) => supabase.from("products").select("id, name, emoji, department_id, sort_order, default_quantity, default_unit").order("sort_order").order("id").range(a, b) as never),
    paged<Head>((a, b) => supabase.from("product_headings").select("id, name, department_id, before_product_id").order("id").range(a, b)),
    paged<Tr>((a, b) => supabase.from("catalog_translations").select("entity_id, locale, name, is_manual").order("id").range(a, b)),
  ]);
  const tr = new Map<string, Record<string, Tr>>();
  for (const t of trs) tr.set(t.entity_id, { ...(tr.get(t.entity_id) ?? {}), [t.locale]: t });
  return { depts, prods, heads, tr };
}

const TABLE = { department: "departments", product: "products" } as const;

function AdminPage() {
  const qc = useQueryClient();
  const check = useServerFn(checkAdmin);
  const translate = useServerFn(translateMissing);
  const saveH = useServerFn(saveHeading);
  const delH = useServerFn(deleteHeading);
  const admin = useQuery({ queryKey: ["admin-check"], queryFn: () => check() });
  const q = useQuery({ queryKey: ["admin-catalog"], queryFn: loadAll, enabled: Boolean(admin.data?.isAdmin) });
  const [cur, setCur] = useState<string | null>(null);
  const [sel, setSel] = useState<Sel>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState<Kind | null>(null);

  const d = q.data;
  const deptById = useMemo(() => new Map((d?.depts ?? []).map((x) => [x.id, x])), [d]);
  const path = (id: string | null) => {
    const out: Dept[] = [];
    let c = id ? deptById.get(id) : undefined;
    while (c) { out.unshift(c); c = c.parent_id ? deptById.get(c.parent_id) : undefined; }
    return out;
  };
  const children = (d?.depts ?? []).filter((x) => x.parent_id === cur);
  const products = (d?.prods ?? []).filter((x) => x.department_id === cur);
  const headings = (d?.heads ?? []).filter((x) => x.department_id === cur);

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["admin-catalog"] });
    await qc.invalidateQueries({ queryKey: ["catalog"] });
  };
  const run = async (fn: () => Promise<unknown>, ok = "Gespeichert") => {
    setBusy(true);
    try { await fn(); toast.success(ok); await refresh(); }
    catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };
  const must = async (p: PromiseLike<{ error: { message: string } | null }>) => { const r = await p; if (r.error) throw new Error(r.error.message); };

  const translateIds = async (ids?: string[]) => {
    let total = 0;
    for (let i = 0; i < 20; i++) {
      const r = await translate({ data: { ids, limit: 120 } });
      total += r.written;
      if (r.remaining === 0) break;
    }
    return total;
  };

  const move = (kind: "department" | "product", list: { id: string }[], idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= list.length) return;
    reorder(kind, list, idx, j);
  };

  const reorder = (kind: "department" | "product", list: { id: string }[], from: number, to: number) => {
    if (from < 0 || from >= list.length) return;
    const next = [...list];
    const [item] = next.splice(from, 1);
    const at = Math.max(0, Math.min(to > from ? to - 1 : to, next.length));
    if (at === from) return;
    next.splice(at, 0, item!);
    run(() => Promise.all(next.map((x, i) => must(supabase.from(TABLE[kind]).update({ sort_order: i + 1 }).eq("id", x.id)))), "Reihenfolge gespeichert");
  };

  /** Zielindex beim Ablegen auf einer Zeile: obere Hälfte = davor, untere Hälfte = danach. */
  const dropIndex = (e: React.DragEvent, i: number) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return e.clientY > r.top + r.height / 2 ? i + 1 : i;
  };

  const [drag, setDrag] = useState<{ kind: "department" | "product" | "heading"; index: number; id?: string } | null>(null);

  const moveHeading = (headingId: string, beforeProductId: string) => {
    const h = d?.heads.find((x) => x.id === headingId);
    if (!h || h.before_product_id === beforeProductId) return;
    run(() => saveH({ data: { id: h.id, departmentId: h.department_id, beforeProductId } }), "Überschrift verschoben");
  };

  const remove = (s: NonNullable<Sel>, name: string) => {
    if (!confirm(`„${name}“ endgültig für alle Nutzer löschen?`)) return;
    run(async () => {
      if (s.kind === "heading") { await delH({ data: { id: s.id } }); }
      else if (s.kind === "product") {
        await must(supabase.from("product_headings").delete().eq("before_product_id", s.id));
        await must(supabase.from("products").delete().eq("id", s.id));
        await must(supabase.from("catalog_translations").delete().eq("entity_id", s.id));
      } else {
        if (d?.depts.some((x) => x.parent_id === s.id) || d?.prods.some((x) => x.department_id === s.id))
          throw new Error("Kategorie ist nicht leer");
        await must(supabase.from("product_headings").delete().eq("department_id", s.id));
        await must(supabase.from("departments").delete().eq("id", s.id));
        await must(supabase.from("catalog_translations").delete().eq("entity_id", s.id));
      }
      setSel(null);
    }, "Gelöscht");
  };

  const results = useMemo(() => {
    const n = search.trim().toLowerCase();
    if (!n || !d) return null;
    const hit = (id: string, name: string) => name.toLowerCase().includes(n) || Object.values(d.tr.get(id) ?? {}).some((t) => t.name.toLowerCase().includes(n));
    return [
      ...d.depts.filter((x) => hit(x.id, x.name)).map((x) => ({ kind: "department" as const, id: x.id, name: x.name, emoji: x.emoji, parent: x.parent_id })),
      ...d.prods.filter((x) => hit(x.id, x.name)).map((x) => ({ kind: "product" as const, id: x.id, name: x.name, emoji: x.emoji, parent: x.department_id })),
      ...d.heads.filter((x) => hit(x.id, x.name)).map((x) => ({ kind: "heading" as const, id: x.id, name: x.name, emoji: null, parent: x.department_id })),
    ].slice(0, 60);
  }, [search, d]);

  if (admin.isLoading) return <p className="pt-6 text-sm text-muted-foreground">Lädt …</p>;
  if (!admin.data?.isAdmin)
    return (
      <div className="space-y-3 pt-6">
        <h1 className="text-2xl font-bold text-foreground">Admin-Panel</h1>
        <p className="text-sm text-muted-foreground">Dein Konto hat noch keine Admin-Berechtigung. Gib Bescheid, dann wird sie freigeschaltet.</p>
        <Button variant="outline" onClick={() => supabase.auth.signOut().then(() => location.assign("/"))}>Abmelden</Button>
      </div>
    );

  const headingBefore = new Map(headings.map((h) => [h.before_product_id, h]));
  const selName = sel ? (sel.kind === "department" ? deptById.get(sel.id)?.name : sel.kind === "product" ? d?.prods.find((p) => p.id === sel.id)?.name : d?.heads.find((h) => h.id === sel.id)?.name) ?? "" : "";

  return (
    <div className="space-y-4 pb-10">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-foreground">Admin-Panel</h1>
        <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut().then(() => location.assign("/"))}>Abmelden</Button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Kategorien" value={d?.depts.length} />
        <Stat label="Produkte" value={d?.prods.length} />
        <Stat label="Überschriften" value={d?.heads.length} />
      </div>

      <Button className="w-full rounded-xl" disabled={busy} onClick={() => run(async () => toast.info(`${await translateIds()} Übersetzungen ergänzt`), "Übersetzung abgeschlossen")}>
        {busy ? "Arbeite …" : "Fehlende Übersetzungen per KI ergänzen"}
      </Button>

      <Input placeholder="Suchen (alle Sprachen) …" value={search} onChange={(e) => setSearch(e.target.value)} className="h-11 rounded-xl" />

      {q.isLoading && <p className="text-sm text-muted-foreground">Lädt Katalog …</p>}

      {results ? (
        <div className="space-y-1">
          {results.length === 0 && <p className="text-sm text-muted-foreground">Keine Treffer.</p>}
          {results.map((r) => (
            <button key={r.kind + r.id} onClick={() => { setCur(r.kind === "department" ? r.id : r.parent); setSel({ kind: r.kind, id: r.id }); setSearch(""); }}
              className="flex w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left text-sm">
              <span>{r.kind === "heading" ? "𝐇" : r.emoji ?? (r.kind === "department" ? "📁" : "•")}</span>
              <span className={r.kind === "heading" ? "font-bold" : ""}>{r.name}</span>
              <span className="ml-auto truncate text-xs text-muted-foreground">{path(r.parent).map((p) => p.name).join(" › ")}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <nav className="flex flex-wrap items-center gap-1 text-sm">
            <button className="font-semibold text-primary" onClick={() => { setCur(null); setSel(null); }}>Katalog</button>
            {path(cur).map((p) => (
              <span key={p.id} className="flex items-center gap-1">
                <span className="text-muted-foreground">›</span>
                <button className="font-semibold text-primary" onClick={() => { setCur(p.id); setSel(null); }}>{p.name}</button>
              </span>
            ))}
          </nav>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setAdding("department")}>+ Kategorie</Button>
            {cur && <Button size="sm" variant="outline" onClick={() => setAdding("product")}>+ Produkt</Button>}
            {cur && products.length > 0 && <Button size="sm" variant="outline" onClick={() => setAdding("heading")}>+ Überschrift</Button>}
          </div>

          {adding && (
            <AddForm kind={adding} products={products} onCancel={() => setAdding(null)}
              onSubmit={(v) => run(async () => {
                if (adding === "heading") {
                  await saveH({ data: { departmentId: cur!, beforeProductId: v.before!, name: v.name } });
                } else if (adding === "department") {
                  const r = await supabase.from("departments").insert({ parent_id: cur, name: v.name, emoji: v.emoji || null, sort_order: children.length + 1 }).select("id").single();
                  if (r.error) throw new Error(r.error.message);
                  await translateIds([r.data.id]);
                } else {
                  const r = await supabase.from("products").insert({ department_id: cur!, name: v.name, emoji: v.emoji || null, default_quantity: v.qty, default_unit: v.unit as never, sort_order: products.length + 1 }).select("id").single();
                  if (r.error) throw new Error(r.error.message);
                  await translateIds([r.data.id]);
                }
                setAdding(null);
              }, "Angelegt & übersetzt")} />
          )}

          {children.length > 0 && (
            <section className="space-y-1">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kategorien</h2>
              {children.map((c, i) => (
                <Row key={c.id} emoji={c.emoji ?? "📁"} name={c.name} active={sel?.id === c.id}
                  dragging={drag?.kind === "department" && drag.index === i}
                  onDragStart={() => setDrag({ kind: "department", index: i })}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { if (drag?.kind === "department") reorder("department", children, drag.index, dropIndex(e, i)); setDrag(null); }}
                  onDragEnd={() => setDrag(null)}
                  sub={`${d!.depts.filter((x) => x.parent_id === c.id).length} Unterkat. · ${d!.prods.filter((x) => x.department_id === c.id).length} Produkte`}
                  onOpen={() => { setCur(c.id); setSel(null); }} onEdit={() => setSel({ kind: "department", id: c.id })}
                  onUp={() => move("department", children, i, -1)} onDown={() => move("department", children, i, 1)} disabled={busy} />
              ))}
            </section>
          )}

          {cur && (
            <section className="space-y-1">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Produkte</h2>
              {products.length === 0 && <p className="text-sm text-muted-foreground">Keine Produkte in dieser Kategorie.</p>}
              {products.map((p, i) => {
                const h = headingBefore.get(p.id);
                return (
                  <div key={p.id} className="space-y-1">
                    {h && (
                      <div
                        draggable
                        onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; setDrag({ kind: "heading", index: i, id: h.id }); }}
                        onDragOver={(e) => { if (drag?.kind === "product") e.preventDefault(); }}
                        onDrop={(e) => {
                          if (drag?.kind === "product") {
                            e.preventDefault();
                            // Produkt direkt unter diese Überschrift setzen
                            reorder("product", products, drag.index, i);
                          }
                          setDrag(null);
                        }}
                        onDragEnd={() => setDrag(null)}
                        onClick={() => setSel({ kind: "heading", id: h.id })}
                        className={`mt-2 flex cursor-grab items-center gap-2 rounded-lg px-2 py-1 text-left text-sm font-bold text-foreground ${drag?.kind === "heading" && drag.id === h.id ? "opacity-40" : ""} ${drag?.kind === "product" ? "border border-dashed border-primary/60 bg-primary-soft/30" : ""} ${sel?.id === h.id ? "bg-primary-soft" : ""}`}>
                        <span className="touch-none select-none text-muted-foreground" aria-label="Ziehen">⠿</span>
                        {h.name}
                      </div>
                    )}
                    <Row emoji={p.emoji ?? "•"} name={p.name} sub={`${p.default_quantity} ${p.default_unit}`} active={sel?.id === p.id}
                      dragging={drag?.kind === "product" && drag.index === i}
                      onDragStart={() => setDrag({ kind: "product", index: i })}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        if (drag?.kind === "product") reorder("product", products, drag.index, dropIndex(e, i));
                        else if (drag?.kind === "heading" && drag.id) moveHeading(drag.id, p.id);
                        setDrag(null);
                      }}
                      onDragEnd={() => setDrag(null)}
                      onEdit={() => setSel({ kind: "product", id: p.id })}
                      onUp={() => move("product", products, i, -1)} onDown={() => move("product", products, i, 1)} disabled={busy} />
                  </div>
                );
              })}
            </section>
          )}
        </>
      )}

      {sel && d && (
        <Editor key={sel.kind + sel.id} sel={sel} name={selName} data={d} products={(d.prods).filter((p) => p.department_id === (sel.kind === "heading" ? d.heads.find((h) => h.id === sel.id)?.department_id : undefined))}
          busy={busy} onClose={() => setSel(null)} onDelete={() => remove(sel, selName)}
          onSave={(patch) => run(async () => {
            if (sel.kind === "heading") {
              const h = d.heads.find((x) => x.id === sel.id)!;
              await saveH({ data: { id: h.id, departmentId: h.department_id, beforeProductId: patch.before ?? h.before_product_id, ...(patch.name && patch.name !== h.name ? { name: patch.name } : {}) } });
            } else {
              const upd: Record<string, unknown> = {};
              if (patch.name) upd['name'] = patch.name;
              if (patch.emoji !== undefined) upd['emoji'] = patch.emoji || null;
              if (patch.parent !== undefined) upd[sel.kind === "product" ? "department_id" : "parent_id"] = patch.parent || null;
              if (patch.qty !== undefined) upd['default_quantity'] = patch.qty;
              if (patch.unit) upd['default_unit'] = patch.unit;
              await must(supabase.from(TABLE[sel.kind]).update(upd as never).eq("id", sel.id));
            }
          })}
          onTr={(locale, value, prev) => {
            if ((prev ?? "") === value.trim()) return;
            run(() => must(value.trim()
              ? supabase.from("catalog_translations").upsert({ entity_type: sel.kind, entity_id: sel.id, locale, name: value.trim(), is_manual: true }, { onConflict: "entity_type,entity_id,locale" })
              : supabase.from("catalog_translations").delete().eq("entity_id", sel.id).eq("locale", locale)));
          }}
          onRetranslate={() => run(async () => {
            await must(supabase.from("catalog_translations").delete().eq("entity_id", sel.id).eq("is_manual", false));
            if (sel.kind === "heading") {
              const h = d.heads.find((x) => x.id === sel.id)!;
              await saveH({ data: { id: h.id, departmentId: h.department_id, beforeProductId: h.before_product_id, name: h.name } });
            } else await translateIds([sel.id]);
          }, "Neu übersetzt")}
          deptOptions={d.depts.map((x) => ({ id: x.id, label: path(x.id).map((p) => p.name).join(" › ") })).sort((a, b) => a.label.localeCompare(b.label, "de"))}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="rounded-xl border border-border bg-card p-2">
      <div className="text-lg font-bold text-foreground">{value ?? "–"}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function Row(p: {
  emoji: string; name: string; sub: string; active: boolean; disabled: boolean;
  onOpen?: () => void; onEdit: () => void; onUp: () => void; onDown: () => void;
  dragging?: boolean; onDragStart?: () => void; onDragOver?: (e: React.DragEvent) => void; onDrop?: (e: React.DragEvent) => void; onDragEnd?: () => void;
}) {
  return (
    <div
      draggable={Boolean(p.onDragStart)}
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; p.onDragStart?.(); }}
      onDragOver={p.onDragOver}
      onDrop={(e) => { e.preventDefault(); p.onDrop?.(e); }}
      onDragEnd={p.onDragEnd}
      className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${p.dragging ? "opacity-40" : ""} ${p.active ? "border-primary bg-primary-soft/40" : "border-border bg-card"}`}
    >
      {p.onDragStart && <span className="cursor-grab touch-none select-none text-muted-foreground" aria-label="Ziehen">⠿</span>}
      <button className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={p.onOpen ?? p.onEdit}>
        <span className="text-lg">{p.emoji}</span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-foreground">{p.name}</span>
          <span className="block truncate text-[11px] text-muted-foreground">{p.sub}</span>
        </span>
      </button>
      <button aria-label="Nach oben" disabled={p.disabled} onClick={p.onUp} className="px-1.5 text-muted-foreground">▲</button>
      <button aria-label="Nach unten" disabled={p.disabled} onClick={p.onDown} className="px-1.5 text-muted-foreground">▼</button>
      <button aria-label="Bearbeiten" onClick={p.onEdit} className="px-1.5 text-primary">✎</button>
    </div>
  );
}

type Vals = { name: string; emoji: string; qty: number; unit: string; before?: string };

function AddForm({ kind, products, onSubmit, onCancel }: { kind: Kind; products: Prod[]; onSubmit: (v: Vals) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [qty, setQty] = useState("1");
  const [unit, setUnit] = useState("stueck");
  const [before, setBefore] = useState(products[0]?.id ?? "");
  const label = { department: "Neue Kategorie", product: "Neues Produkt", heading: "Neue Überschrift" }[kind];
  return (
    <div className="space-y-2 rounded-xl border border-dashed border-primary/50 p-3">
      <p className="text-sm font-semibold text-primary">{label}</p>
      <div className={kind === "heading" ? "" : "grid grid-cols-[1fr_4rem] gap-2"}>
        <Input autoFocus placeholder="Name (Deutsch)" value={name} onChange={(e) => setName(e.target.value)} />
        {kind !== "heading" && <Input placeholder="🙂" value={emoji} onChange={(e) => setEmoji(e.target.value)} />}
      </div>
      {kind === "product" && (
        <div className="grid grid-cols-2 gap-2">
          <Input inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} />
          <UnitSelect value={unit} onChange={setUnit} />
        </div>
      )}
      {kind === "heading" && (
        <select value={before} onChange={(e) => setBefore(e.target.value)} className="w-full rounded-lg border border-input bg-background px-2 py-2 text-sm">
          {products.map((p) => <option key={p.id} value={p.id}>über: {p.name}</option>)}
        </select>
      )}
      <div className="flex gap-2">
        <Button className="flex-1" disabled={!name.trim()} onClick={() => onSubmit({ name: name.trim(), emoji, qty: Number(qty.replace(",", ".")) || 1, unit, before })}>Anlegen & übersetzen</Button>
        <Button variant="ghost" onClick={onCancel}>Abbrechen</Button>
      </div>
    </div>
  );
}

function UnitSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border border-input bg-background px-2 text-sm">
      {getUnits("de-DE").map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
    </select>
  );
}

type Patch = { name?: string; emoji?: string; parent?: string; qty?: number; unit?: string; before?: string };

function Editor(p: {
  sel: NonNullable<Sel>; name: string; data: Awaited<ReturnType<typeof loadAll>>; products: Prod[]; busy: boolean;
  deptOptions: { id: string; label: string }[];
  onClose: () => void; onDelete: () => void; onSave: (patch: Patch) => void;
  onTr: (locale: string, v: string, prev?: string) => void; onRetranslate: () => void;
}) {
  const { sel, data } = p;
  const dept = sel.kind === "department" ? data.depts.find((x) => x.id === sel.id) : undefined;
  const prod = sel.kind === "product" ? data.prods.find((x) => x.id === sel.id) : undefined;
  const head = sel.kind === "heading" ? data.heads.find((x) => x.id === sel.id) : undefined;
  const [name, setName] = useState(p.name);
  const [emoji, setEmoji] = useState(dept?.emoji ?? prod?.emoji ?? "");
  const [parent, setParent] = useState(dept?.parent_id ?? prod?.department_id ?? "");
  const [qty, setQty] = useState(String(prod?.default_quantity ?? 1));
  const [unit, setUnit] = useState(prod?.default_unit ?? "stueck");
  const [before, setBefore] = useState(head?.before_product_id ?? "");
  const tr = data.tr.get(sel.id) ?? {};
  const title = { department: "Kategorie", product: "Produkt", heading: "Überschrift" }[sel.kind];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30" onClick={p.onClose}>
      <div className="max-h-[88dvh] w-full max-w-[440px] space-y-3 overflow-y-auto rounded-t-3xl bg-background p-5 pb-[calc(2rem+env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">{title} bearbeiten</h2>
          <button onClick={p.onClose} className="text-muted-foreground" aria-label="Schliessen">✕</button>
        </div>

        <div className={sel.kind === "heading" ? "" : "grid grid-cols-[1fr_4rem] gap-2"}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (Deutsch)" />
          {sel.kind !== "heading" && <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="🙂" />}
        </div>
        {sel.kind !== "heading" && (
          <select value={parent} onChange={(e) => setParent(e.target.value)} className="w-full rounded-lg border border-input bg-background px-2 py-2 text-sm">
            {sel.kind === "department" && <option value="">Oberste Ebene</option>}
            {p.deptOptions.filter((o) => o.id !== sel.id).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        )}
        {prod && (
          <div className="grid grid-cols-2 gap-2">
            <Input inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} />
            <UnitSelect value={unit} onChange={setUnit} />
          </div>
        )}
        {head && (
          <select value={before} onChange={(e) => setBefore(e.target.value)} className="w-full rounded-lg border border-input bg-background px-2 py-2 text-sm">
            {p.products.map((x) => <option key={x.id} value={x.id}>über: {x.name}</option>)}
          </select>
        )}
        <div className="flex gap-2">
          <Button className="flex-1" disabled={p.busy || !name.trim()} onClick={() => p.onSave({
            name: name.trim(), emoji, before,
            ...(sel.kind !== "heading" ? { parent } : {}),
            ...(prod ? { qty: Number(qty.replace(",", ".")) || 1, unit } : {}),
          })}>Speichern</Button>
          <Button variant="destructive" disabled={p.busy} onClick={p.onDelete}>Löschen</Button>
        </div>

        <div className="flex items-center justify-between pt-2">
          <h3 className="text-sm font-semibold text-foreground">Sprachen</h3>
          <Button size="sm" variant="outline" disabled={p.busy} onClick={p.onRetranslate}>KI neu übersetzen</Button>
        </div>
        <p className="text-[11px] text-muted-foreground">Grün = von Hand bearbeitet, wird von der KI nicht überschrieben. Leeren = Übersetzung löschen.</p>
        <div className="space-y-1.5">
          {LOCALES.filter((l) => l.id !== "de-DE").map((l) => (
            <TrField key={l.id + (tr[l.id]?.name ?? "")} label={`${l.flag} ${l.id}`} value={tr[l.id]?.name ?? ""} manual={tr[l.id]?.is_manual}
              onSave={(v) => p.onTr(l.id, v, tr[l.id]?.name)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TrField({ label, value, manual, onSave }: { label: string; value: string; manual?: boolean | undefined; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  return (
    <label className="grid grid-cols-[5.5rem_1fr] items-center gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <input value={v} onChange={(e) => setV(e.target.value)} onBlur={() => onSave(v)}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        className={`rounded-lg border px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary ${manual ? "border-primary bg-primary-soft/30" : "border-input bg-background"}`} />
    </label>
  );
}
