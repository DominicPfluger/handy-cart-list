import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { checkAdmin, translateMissing } from "@/lib/admin.functions";
import { LOCALES } from "@/i18n";
import { getUnits } from "@/lib/units";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Shoppi — Katalog verwalten" },
      { name: "description", content: "Produkte, Kategorien und Übersetzungen des Shoppi-Katalogs bearbeiten." },
      { property: "og:title", content: "Shoppi — Katalog verwalten" },
      { property: "og:description", content: "Produkte, Kategorien und Übersetzungen bearbeiten." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

type Entity = { id: string; type: "department" | "product"; name: string; parentId: string | null };
type Tr = { entity_id: string; locale: string; name: string; is_manual: boolean };
const PAGE = 20;

async function loadAll() {
  const [d, p] = await Promise.all([
    supabase.from("departments").select("id, name, parent_id, sort_order").order("sort_order"),
    supabase.from("products").select("id, name, department_id, sort_order").order("sort_order"),
  ]);
  const trs: Tr[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await supabase.from("catalog_translations").select("entity_id, locale, name, is_manual").order("id").range(from, from + 999);
    trs.push(...((data ?? []) as Tr[]));
    if (!data || data.length < 1000) break;
  }
  const entities: Entity[] = [
    ...(d.data ?? []).map((r) => ({ id: r.id, type: "department" as const, name: r.name, parentId: r.parent_id })),
    ...(p.data ?? []).map((r) => ({ id: r.id, type: "product" as const, name: r.name, parentId: r.department_id })),
  ];
  const map = new Map<string, Record<string, Tr>>();
  for (const t of trs) {
    const e = map.get(t.entity_id) ?? {};
    e[t.locale] = t;
    map.set(t.entity_id, e);
  }
  return { entities, translations: map };
}

function AdminPage() {
  const qc = useQueryClient();
  const check = useServerFn(checkAdmin);
  const translate = useServerFn(translateMissing);
  const admin = useQuery({ queryKey: ["admin-check"], queryFn: () => check() });
  const data = useQuery({ queryKey: ["admin-catalog"], queryFn: loadAll, enabled: Boolean(admin.data?.isAdmin) });
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);

  const deptPath = useMemo(() => {
    const byId = new Map((data.data?.entities ?? []).filter((e) => e.type === "department").map((e) => [e.id, e]));
    const path = (id: string | null): string => {
      const parts: string[] = [];
      let cur = id ? byId.get(id) : undefined;
      while (cur) { parts.unshift(cur.name); cur = cur.parentId ? byId.get(cur.parentId) : undefined; }
      return parts.join(" › ");
    };
    return { byId, path };
  }, [data.data]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const all = data.data?.entities ?? [];
    if (!needle) return all;
    return all.filter((e) => {
      if (e.name.toLowerCase().includes(needle)) return true;
      const tr = data.data?.translations.get(e.id);
      return tr ? Object.values(tr).some((t) => t.name.toLowerCase().includes(needle)) : false;
    });
  }, [q, data.data]);

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["admin-catalog"] });
    await qc.invalidateQueries({ queryKey: ["catalog"] });
  };

  const runTranslate = async (ids?: string[]) => {
    setBusy(true);
    try {
      let total = 0;
      for (let i = 0; i < 20; i++) {
        const res = await translate({ data: { ids, limit: 120 } });
        total += res.written;
        if (res.remaining === 0) break;
      }
      toast.success(`${total} Übersetzungen ergänzt`);
      await refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const saveBase = async (e: Entity, name: string) => {
    if (!name.trim() || name === e.name) return;
    const { error } = await supabase.from(e.type === "department" ? "departments" : "products").update({ name: name.trim() }).eq("id", e.id);
    if (error) return toast.error(error.message);
    toast.success("Gespeichert");
    await refresh();
  };

  const saveTr = async (e: Entity, locale: string, name: string, prev?: string) => {
    if ((prev ?? "") === name.trim()) return;
    const res = name.trim()
      ? await supabase.from("catalog_translations").upsert(
          { entity_type: e.type, entity_id: e.id, locale, name: name.trim(), is_manual: true },
          { onConflict: "entity_type,entity_id,locale" },
        )
      : await supabase.from("catalog_translations").delete().eq("entity_id", e.id).eq("locale", locale);
    if (res.error) return toast.error(res.error.message);
    toast.success("Gespeichert");
    await refresh();
  };

  if (admin.isLoading) return <p className="pt-6 text-sm text-muted-foreground">Lädt …</p>;
  if (!admin.data?.isAdmin)
    return (
      <div className="space-y-3 pt-6">
        <h1 className="text-2xl font-bold text-foreground">Katalog verwalten</h1>
        <p className="text-sm text-muted-foreground">Dein Konto hat noch keine Admin-Berechtigung. Gib Bescheid, dann wird sie freigeschaltet.</p>
        <Button variant="outline" onClick={() => supabase.auth.signOut().then(() => location.assign("/"))}>Abmelden</Button>
      </div>
    );

  const rows = filtered.slice(page * PAGE, page * PAGE + PAGE);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const locales = LOCALES.filter((l) => l.id !== "de-DE");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-foreground">Katalog verwalten</h1>
        <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut().then(() => location.assign("/"))}>Abmelden</Button>
      </div>

      <Button className="w-full rounded-xl" disabled={busy} onClick={() => runTranslate()}>
        {busy ? "Übersetze …" : "Fehlende Übersetzungen per KI ergänzen"}
      </Button>

      <CreateForm
        departments={(data.data?.entities ?? []).filter((e) => e.type === "department")}
        path={deptPath.path}
        onCreated={async (id) => { await refresh(); await runTranslate([id]); }}
      />

      <Input placeholder="Suchen (alle Sprachen)" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} className="h-11 rounded-xl" />
      <p className="text-xs text-muted-foreground">Von Hand bearbeitete Übersetzungen sind grün markiert und werden von der KI nicht überschrieben. Leeren = Übersetzung löschen.</p>

      {data.isLoading && <p className="text-sm text-muted-foreground">Lädt …</p>}
      <div className="space-y-3">
        {rows.map((e) => {
          const tr = data.data?.translations.get(e.id) ?? {};
          return (
            <details key={e.id} className="rounded-xl border border-border bg-card p-3">
              <summary className="cursor-pointer text-sm font-semibold text-foreground">
                {e.type === "department" ? "📁 " : ""}{e.name}
                <span className="ml-2 text-xs font-normal text-muted-foreground">{deptPath.path(e.type === "department" ? e.parentId : e.parentId)}</span>
              </summary>
              <div className="mt-3 space-y-2">
                <Field label="🇩🇪 Deutsch (Basis)" value={e.name} onSave={(v) => saveBase(e, v)} />
                {locales.map((l) => (
                  <Field
                    key={l.id}
                    label={`${l.flag} ${l.id}`}
                    value={tr[l.id]?.name ?? ""}
                    manual={tr[l.id]?.is_manual}
                    onSave={(v) => saveTr(e, l.id, v, tr[l.id]?.name)}
                  />
                ))}
              </div>
            </details>
          );
        })}
      </div>
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>‹</Button>
        <span className="text-xs text-muted-foreground">{page + 1} / {pages} · {filtered.length} Einträge</span>
        <Button variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>›</Button>
      </div>
    </div>
  );
}

function Field({ label, value, manual, onSave }: { label: string; value: string; manual?: boolean | undefined; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  return (
    <label className="grid grid-cols-[6.5rem_1fr] items-center gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => onSave(v)}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        className={`rounded-lg border px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary ${manual ? "border-primary bg-primary-soft/30" : "border-input bg-background"}`}
      />
    </label>
  );
}

function CreateForm({ departments, path, onCreated }: { departments: Entity[]; path: (id: string | null) => string; onCreated: (id: string) => void }) {
  const [kind, setKind] = useState<"product" | "department">("product");
  const [parent, setParent] = useState("");
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [qty, setQty] = useState("1");
  const [unit, setUnit] = useState("stueck");
  const options = useMemo(
    () => departments.map((d) => ({ id: d.id, label: path(d.id) })).sort((a, b) => a.label.localeCompare(b.label, "de")),
    [departments, path],
  );

  const create = async () => {
    if (!name.trim() || (kind === "product" && !parent)) return;
    const res =
      kind === "product"
        ? await supabase.from("products").insert({
            department_id: parent, name: name.trim(), emoji: emoji || null,
            default_quantity: Number(qty.replace(",", ".")) || 1, default_unit: unit as never, sort_order: 999,
          }).select("id").single()
        : await supabase.from("departments").insert({ parent_id: parent || null, name: name.trim(), emoji: emoji || null, sort_order: 999 }).select("id").single();
    if (res.error) return toast.error(res.error.message);
    toast.success(`„${name}“ angelegt – wird übersetzt`);
    setName("");
    setEmoji("");
    onCreated(res.data.id);
  };

  return (
    <details className="rounded-xl border border-dashed border-primary/40 p-3">
      <summary className="cursor-pointer text-sm font-semibold text-primary">+ Neu anlegen</summary>
      <div className="mt-3 space-y-2">
        <select value={kind} onChange={(e) => setKind(e.target.value as never)} className="w-full rounded-lg border border-input bg-background px-2 py-2 text-sm">
          <option value="product">Produkt</option>
          <option value="department">Kategorie</option>
        </select>
        <select value={parent} onChange={(e) => setParent(e.target.value)} className="w-full rounded-lg border border-input bg-background px-2 py-2 text-sm">
          <option value="">{kind === "product" ? "Kategorie wählen …" : "Oberste Ebene"}</option>
          {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <div className="grid grid-cols-[1fr_4rem] gap-2">
          <Input placeholder="Name (Deutsch)" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="🙂" value={emoji} onChange={(e) => setEmoji(e.target.value)} />
        </div>
        {kind === "product" && (
          <div className="grid grid-cols-2 gap-2">
            <Input inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} />
            <select value={unit} onChange={(e) => setUnit(e.target.value)} className="rounded-lg border border-input bg-background px-2 text-sm">
              {getUnits("de-DE").map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
          </div>
        )}
        <Button className="w-full" onClick={create} disabled={!name.trim() || (kind === "product" && !parent)}>Anlegen & übersetzen</Button>
      </div>
    </details>
  );
}
