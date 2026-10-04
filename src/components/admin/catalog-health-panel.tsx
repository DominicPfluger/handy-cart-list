import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { mergeProducts } from "@/lib/admin.functions";
import { useT } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MissingImagesPanel } from "./missing-images-panel";

type Dept = { id: string; name: string; emoji: string | null; parent_id: string | null; image_path: string | null };
type Prod = { id: string; name: string; emoji: string | null; department_id: string; image_path: string | null; icon_path?: string | null };
type Tr = Map<string, Record<string, { name: string }>>;

const IGNORE_KEY = "shoppi:health-ignored";
const LOCALES = ["en-US", "en-GB", "en-CA", "es-ES", "es-MX", "fr-FR", "fr-CA", "it-IT", "it-CH", "pt-PT", "pt-BR", "nl-NL", "nl-BE", "de-AT", "de-CH"];

/** Namen für Vergleiche normalisieren: Kleinbuchstaben, ohne Akzente, ß→ss. */
function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss").replace(/\s+/g, " ").trim();
}

type Pair = { a: Prod; b: Prod; kind: "exact" | "similar" | "synonym" };

function loadIgnored(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(IGNORE_KEY) ?? "[]")); } catch { return new Set(); }
}

/** Katalog-Pflege: Datenlücken, Dubletten-Scan und zentrale Synonym-Verwaltung. */
export function CatalogHealthPanel({ depts, prods, tr, onEdit }: {
  depts: Dept[]; prods: Prod[]; tr: Tr; onEdit: (productId: string) => void;
}) {
  const { t: T, locale } = useT();
  const qc = useQueryClient();
  const merge = useServerFn(mergeProducts);
  const [ignored, setIgnored] = useState<Set<string>>(loadIgnored);
  const [scanned, setScanned] = useState(false);
  const [busy, setBusy] = useState(false);
  const [openGap, setOpenGap] = useState<string | null>(null);
  const [synSearch, setSynSearch] = useState("");
  const [copyOpen, setCopyOpen] = useState(false);

  const syns = useQuery({
    queryKey: ["health-synonyms"],
    queryFn: async () => {
      const all: Array<{ id: string; product_id: string; locale: string; term: string }> = [];
      for (let f = 0; ; f += 1000) {
        const { data } = await supabase.from("product_synonyms" as never).select("id, product_id, locale, term").range(f, f + 999);
        all.push(...((data ?? []) as typeof all));
        if (!data || data.length < 1000) break;
      }
      return all;
    },
  });
  const priced = useQuery({
    queryKey: ["health-priced"],
    queryFn: async () => {
      const set = new Set<string>();
      for (let f = 0; ; f += 1000) {
        const { data } = await supabase.from("product_reference_prices" as never).select("product_id").range(f, f + 999);
        for (const r of (data ?? []) as Array<{ product_id: string }>) set.add(r.product_id);
        if (!data || data.length < 1000) break;
      }
      return set;
    },
  });

  const deptName = useMemo(() => new Map(depts.map((d) => [d.id, d.name])), [depts]);
  const prodById = useMemo(() => new Map(prods.map((p) => [p.id, p])), [prods]);
  const prodCountByDept = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of prods) m.set(p.department_id, (m.get(p.department_id) ?? 0) + 1);
    return m;
  }, [prods]);

  const gaps = useMemo(() => {
    const noImage = prods.filter((p) => !p.image_path);
    const noEmoji = prods.filter((p) => !p.emoji);
    const noPrice = priced.data ? prods.filter((p) => !priced.data.has(p.id)) : [];
    const missingTr = prods.map((p) => {
      const rec = tr.get(p.id) ?? {};
      const missing = LOCALES.filter((l) => !rec[l]?.name?.trim());
      return { p, missing };
    }).filter((x) => x.missing.length > 0);
    const emptyDepts = depts.filter((d) => !depts.some((c) => c.parent_id === d.id) && !(prodCountByDept.get(d.id) ?? 0));
    const deptNoImage = depts.filter((d) => !d.image_path);
    return { noImage, noEmoji, noPrice, missingTr, emptyDepts, deptNoImage };
  }, [prods, depts, tr, priced.data, prodCountByDept]);

  const pairs = useMemo<Pair[]>(() => {
    if (!scanned) return [];
    const out: Pair[] = [];
    const seen = new Set<string>();
    const keyOf = (a: string, b: string) => [a, b].sort().join("|");
    // Gleiche Namen
    const byNorm = new Map<string, Prod[]>();
    for (const p of prods) {
      const k = norm(p.name);
      byNorm.set(k, [...(byNorm.get(k) ?? []), p]);
    }
    for (const group of byNorm.values()) {
      for (let i = 0; i < group.length; i++) for (let j = i + 1; j < group.length; j++) {
        const k = keyOf(group[i]!.id, group[j]!.id);
        if (!seen.has(k)) { seen.add(k); out.push({ a: group[i]!, b: group[j]!, kind: "exact" }); }
      }
    }
    // Ähnliche Namen: innerhalb von Eimern nach erstem Wort vergleichen
    const buckets = new Map<string, Prod[]>();
    for (const p of prods) {
      const first = norm(p.name).split(" ")[0] ?? "";
      if (first.length < 3) continue;
      buckets.set(first, [...(buckets.get(first) ?? []), p]);
    }
    for (const bucket of buckets.values()) {
      for (let i = 0; i < bucket.length; i++) for (let j = i + 1; j < bucket.length; j++) {
        const a = bucket[i]!, b = bucket[j]!;
        const k = keyOf(a.id, b.id);
        if (seen.has(k)) continue;
        const na = norm(a.name), nb = norm(b.name);
        const wa = new Set(na.split(" ")), wb = new Set(nb.split(" "));
        const smaller = wa.size <= wb.size ? wa : wb;
        const larger = wa.size <= wb.size ? wb : wa;
        const subset = [...smaller].every((w) => larger.has(w));
        if (subset || na.includes(nb) || nb.includes(na)) { seen.add(k); out.push({ a, b, kind: "similar" }); }
      }
    }
    // Synonym-Konflikte: Produktname == Synonym eines anderen Produkts
    const nameToProd = new Map<string, Prod>();
    for (const p of prods) nameToProd.set(norm(p.name), p);
    for (const s of syns.data ?? []) {
      const hit = nameToProd.get(norm(s.term));
      const owner = prodById.get(s.product_id);
      if (hit && owner && hit.id !== owner.id) {
        const k = keyOf(hit.id, owner.id);
        if (!seen.has(k)) { seen.add(k); out.push({ a: hit, b: owner, kind: "synonym" }); }
      }
    }
    return out.filter((p) => !ignored.has(keyOf(p.a.id, p.b.id)));
  }, [scanned, prods, syns.data, prodById, ignored]);

  const ignore = (p: Pair) => {
    const next = new Set(ignored);
    next.add([p.a.id, p.b.id].sort().join("|"));
    setIgnored(next);
    localStorage.setItem(IGNORE_KEY, JSON.stringify([...next]));
  };

  const doMerge = async (p: Pair) => {
    if (!confirm(T("adm.health.mergeConfirm", { remove: p.b.name, keep: p.a.name }))) return;
    setBusy(true);
    try {
      await merge({ data: { keepId: p.a.id, removeId: p.b.id } });
      toast.success(T("adm.health.merged"));
      await qc.invalidateQueries({ queryKey: ["admin-catalog"] });
      await qc.invalidateQueries({ queryKey: ["catalog"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
    setBusy(false);
  };

  const doLink = async (p: Pair) => {
    setBusy(true);
    const { error } = await supabase.from("product_aliases").insert({ product_id: p.a.id, department_id: p.b.department_id, sort_order: 999 } as never);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(T("adm.health.linked"));
    ignore(p);
  };

  const removeSyn = async (id: string) => {
    const { error } = await supabase.from("product_synonyms" as never).delete().eq("id", id);
    if (error) toast.error(error.message); else void syns.refetch();
  };

  const gapCards: Array<{ id: string; label: string; count: number; items: Array<{ id: string; label: string; productId?: string }> }> = [
    { id: "noImage", label: T("adm.health.noImage"), count: gaps.noImage.length, items: gaps.noImage.slice(0, 50).map((p) => ({ id: p.id, label: `${p.emoji ?? "🛒"} ${p.name} (${deptName.get(p.department_id) ?? "?"})`, productId: p.id })) },
    { id: "noEmoji", label: T("adm.health.noEmoji"), count: gaps.noEmoji.length, items: gaps.noEmoji.slice(0, 50).map((p) => ({ id: p.id, label: `${p.name} (${deptName.get(p.department_id) ?? "?"})`, productId: p.id })) },
    { id: "noPrice", label: T("adm.health.noPrice"), count: gaps.noPrice.length, items: gaps.noPrice.slice(0, 50).map((p) => ({ id: p.id, label: `${p.emoji ?? "🛒"} ${p.name}`, productId: p.id })) },
    { id: "missingTr", label: T("adm.health.missingTr"), count: gaps.missingTr.length, items: gaps.missingTr.slice(0, 50).map((x) => ({ id: x.p.id, label: `${x.p.emoji ?? "🛒"} ${x.p.name} (${x.missing.length})`, productId: x.p.id })) },
    { id: "emptyDepts", label: T("adm.health.emptyDept"), count: gaps.emptyDepts.length, items: gaps.emptyDepts.map((d) => ({ id: d.id, label: `${d.emoji ?? "📁"} ${d.name}` })) },
    { id: "deptNoImage", label: T("adm.health.deptNoImage"), count: gaps.deptNoImage.length, items: gaps.deptNoImage.map((d) => ({ id: d.id, label: `${d.emoji ?? "📁"} ${d.name}` })) },
  ];

  const filteredSyns = (syns.data ?? []).filter((s) => !synSearch.trim() || s.term.toLowerCase().includes(synSearch.trim().toLowerCase()) || (prodById.get(s.product_id)?.name ?? "").toLowerCase().includes(synSearch.trim().toLowerCase()));
  const synNameSet = new Set(prods.map((p) => norm(p.name)));

  /** Gesamter Katalog als Text: Kategorie-Baum mit #-Überschriften, Produkte ohne Emojis. */
  const buildCatalogText = () => {
    const nameOf = (id: string, base: string) => tr.get(id)?.[locale]?.name?.trim() || base;
    const byParent = new Map<string | null, Dept[]>();
    for (const d of depts) byParent.set(d.parent_id, [...(byParent.get(d.parent_id) ?? []), d]);
    for (const list of byParent.values()) list.sort((a, b) => nameOf(a.id, a.name).localeCompare(nameOf(b.id, b.name), locale));
    const prodsByDept = new Map<string, Prod[]>();
    for (const p of prods) prodsByDept.set(p.department_id, [...(prodsByDept.get(p.department_id) ?? []), p]);
    for (const list of prodsByDept.values()) list.sort((a, b) => nameOf(a.id, a.name).localeCompare(nameOf(b.id, b.name), locale));
    const lines: string[] = [];
    const walk = (d: Dept, path: string[]) => {
      const name = nameOf(d.id, d.name);
      const nextPath = [...path, name];
      lines.push("", `${d.parent_id ? "##" : "#"} ${nextPath.join(" › ")}`);
      for (const p of prodsByDept.get(d.id) ?? []) lines.push(nameOf(p.id, p.name));
      for (const c of byParent.get(d.id) ?? []) walk(c, nextPath);
    };
    for (const root of byParent.get(null) ?? []) walk(root, []);
    return lines.join("\n").trim() + "\n";
  };

  return (
    <div className="space-y-6 pt-2">
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">{T("adm.health.gaps")}</h2>
          <Button size="sm" variant="outline" onClick={() => setCopyOpen(true)}>{T("adm.copyCatalog")}</Button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {gapCards.map((g) => (
            <button key={g.id} type="button" onClick={() => setOpenGap(openGap === g.id ? null : g.id)}
              className={`rounded-xl border p-2 text-left transition-colors ${openGap === g.id ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
              <div className={`text-lg font-bold ${g.count > 0 ? "text-foreground" : "text-muted-foreground"}`}>{g.count}</div>
              <div className="text-[11px] text-muted-foreground">{g.label}</div>
            </button>
          ))}
        </div>
        {openGap && (
          <ul className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-border bg-card p-2 text-sm">
            {gapCards.find((g) => g.id === openGap)?.items.map((it) => (
              <li key={it.id} className="flex items-center justify-between gap-2">
                <span className="truncate">{it.label}</span>
                {it.productId && <Button size="sm" variant="outline" onClick={() => onEdit(it.productId!)}>{T("adm.health.open")}</Button>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <MissingImagesPanel depts={depts} prods={prods} onEdit={onEdit} />


      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">{T("adm.health.dupes")}</h2>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => setScanned(true)}>{scanned ? T("adm.health.scan") : T("adm.health.scan")}</Button>
        </div>
        {scanned && (
          pairs.length === 0 ? <p className="text-sm text-muted-foreground">{T("adm.health.noDupes")}</p> : (
            <>
              <p className="text-xs text-muted-foreground">{T("adm.health.pairs", { n: pairs.length })}</p>
              <ul className="space-y-2">
                {pairs.slice(0, 100).map((p) => (
                  <li key={`${p.a.id}-${p.b.id}`} className="rounded-xl border border-border bg-card p-2 text-sm">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-medium">{p.a.emoji ?? "🛒"} {p.a.name}</span>
                      <span className="text-muted-foreground">({deptName.get(p.a.department_id) ?? "?"})</span>
                      <span className="text-muted-foreground">↔</span>
                      <span className="font-medium">{p.b.emoji ?? "🛒"} {p.b.name}</span>
                      <span className="text-muted-foreground">({deptName.get(p.b.department_id) ?? "?"})</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                        {p.kind === "exact" ? T("adm.health.exact") : p.kind === "similar" ? T("adm.health.similar") : T("adm.health.synConflict")}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => void doMerge(p)}>{T("adm.health.merge")}</Button>
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => void doLink(p)}>{T("adm.health.link")}</Button>
                      <Button size="sm" variant="ghost" disabled={busy} onClick={() => ignore(p)}>{T("adm.health.ignore")}</Button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">{T("adm.health.synonyms")}</h2>
        <Input value={synSearch} onChange={(e) => setSynSearch(e.target.value)} placeholder={T("adm.health.synSearch")} />
        <ul className="max-h-72 space-y-1 overflow-y-auto rounded-xl border border-border bg-card p-2 text-sm">
          {filteredSyns.slice(0, 200).map((s) => {
            const prod = prodById.get(s.product_id);
            const collision = synNameSet.has(norm(s.term));
            return (
              <li key={s.id} className="flex items-center justify-between gap-2">
                <span className="truncate">
                  <span className="font-medium">{s.term}</span>
                  <span className="text-muted-foreground"> → {prod?.name ?? "?"} ({s.locale})</span>
                  {collision && <span className="ml-1 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] text-destructive">{T("adm.health.collision")}</span>}
                </span>
                <button type="button" aria-label={`${s.term} ✕`} onClick={() => void removeSyn(s.id)} className="text-muted-foreground hover:text-destructive">✕</button>
              </li>
            );
          })}
        </ul>
      </section>
      {copyOpen && <CatalogTextDialog text={buildCatalogText()} onClose={() => setCopyOpen(false)} />}
    </div>
  );
}

/** Dialog: gesamter Katalog als kopierbarer Text. */
function CatalogTextDialog(p: { text: string; onClose: () => void }) {
  const { t: T } = useT();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(p.text);
      setCopied(true);
      toast.success(T("export.copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(T("export.copyFailed"));
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={p.onClose}>
      <div className="flex w-full max-w-sm flex-col gap-3 rounded-t-2xl bg-card p-4 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-bold text-foreground">{T("adm.copyCatalogTitle")}</p>
        <textarea readOnly value={p.text} rows={14}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 font-mono text-xs" />
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={p.onClose}>{T("adm.cancel")}</Button>
          <Button className="flex-1" onClick={() => void copy()}>{copied ? "✓ " : ""}{T("share.copyText")}</Button>
        </div>
      </div>
    </div>
  );
}
