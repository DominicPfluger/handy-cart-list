import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Languages, Pencil, Plus, Puzzle, Save, Search, Trash2, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LOCALES, useT, type Locale } from "@/i18n";
import { Button } from "@/components/ui/button";
import { speakSentences } from "@/components/speak-list-button";
import { pronunciationRulesQueryKey, type PronunciationRule } from "@/lib/pronunciation-rules";
import { LocaleRuleChips } from "@/components/admin/locale-rule-chips";

type Prod = { id: string; name: string };

async function loadAll<T>(fetch: (a: number, b: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const out: T[] = [];
  for (let a = 0; ; a += 1000) {
    const { data, error } = await fetch(a, a + 999);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < 1000) return out;
  }
}

/** Alphabetische Liste aller Katalogprodukte mit Aussprache pro Vorlese-Sprache. */
export function ProductPronunciationList({ locale, rules, canEdit }: { locale: Locale; rules: PronunciationRule[]; canEdit: boolean }) {
  const { t } = useT();
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(100);
  const products = useQuery({
    queryKey: ["admin-pron-products"],
    queryFn: () => loadAll<Prod>((a, b) => supabase.from("products").select("id, name").order("id").range(a, b) as never),
    staleTime: 5 * 60_000,
  });
  const translations = useQuery({
    queryKey: ["admin-pron-translations", locale],
    queryFn: () => loadAll<{ entity_id: string; name: string }>((a, b) =>
      supabase.from("catalog_translations").select("entity_id, name").eq("entity_type", "product").eq("locale", locale).order("id").range(a, b) as never),
    staleTime: 5 * 60_000,
  });

  const rows = useMemo(() => {
    const tr = new Map((translations.data ?? []).map((x) => [x.entity_id, x.name]));
    const seen = new Set<string>();
    const list: { id: string; name: string; base: string }[] = [];
    for (const p of products.data ?? []) {
      const name = (tr.get(p.id) ?? p.name).trim();
      const k = name.toLowerCase();
      if (!name || seen.has(k)) continue;
      seen.add(k);
      list.push({ id: p.id, name, base: p.name });
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, locale));
  }, [products.data, translations.data, locale]);

  const needle = q.trim().toLowerCase();
  const filtered = needle ? rows.filter((r) => r.name.toLowerCase().includes(needle) || r.base.toLowerCase().includes(needle)) : rows;
  const ruleMap = useMemo(() => new Map(rules.filter((r) => r.locale === locale).map((r) => [r.written.toLowerCase(), r])), [rules, locale]);
  const allByWritten = useMemo(() => {
    const m = new Map<string, PronunciationRule[]>();
    for (const r of rules) { const k = r.written.toLowerCase(); m.set(k, [...(m.get(k) ?? []), r]); }
    return m;
  }, [rules]);
  const localeRules = useMemo(() => rules.filter((r) => r.locale === locale && r.written.trim()), [rules, locale]);
  const partsFor = (name: string) => { const n = name.toLowerCase(); return localeRules.filter((r) => { const w = r.written.toLowerCase(); return w !== n && n.includes(w); }); };
  const rulesFor = (name: string, base: string) => {
    const set = new Map<string, PronunciationRule>();
    for (const k of [name.toLowerCase(), base.toLowerCase()]) for (const r of allByWritten.get(k) ?? []) set.set(r.id, r);
    return [...set.values()];
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => { setQ(e.target.value); setLimit(100); }} placeholder={t("speak.pronunciationWritten")}
          className="h-10 w-full rounded-lg border border-input bg-background pl-8 pr-2 text-sm text-foreground outline-none focus:border-primary" />
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} / {rows.length}</p>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr><th className="px-3 py-2 font-medium">{t("speak.pronunciationWritten")}</th><th className="px-3 py-2 font-medium">{t("speak.pronunciationSpoken")}</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(products.isLoading || translations.isLoading) && <tr><td colSpan={2} className="px-3 py-4 text-muted-foreground">…</td></tr>}
            {filtered.slice(0, limit).map((r) => (
              <Row key={r.id + locale} name={r.name} locale={locale} rule={ruleMap.get(r.name.toLowerCase())} all={rulesFor(r.name, r.base)} parts={partsFor(r.name)} canEdit={canEdit} />
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length > limit && (
        <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setLimit((l) => l + 200)}>
          + {Math.min(200, filtered.length - limit)}
        </Button>
      )}
    </div>
  );
}

function Row({ name, locale, rule, all, parts, canEdit }: { name: string; locale: Locale; rule?: PronunciationRule | undefined; all: PronunciationRule[]; parts: PronunciationRule[]; canEdit: boolean }) {
  const { t } = useT();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [spoken, setSpoken] = useState(rule?.spoken ?? "");
  const [busy, setBusy] = useState(false);
  const [partOpen, setPartOpen] = useState(false);
  const [partW, setPartW] = useState("");
  const [partS, setPartS] = useState("");
  const [partAll, setPartAll] = useState(false);
  const variants = LOCALES.filter((l) => l.id.split("-")[0] === locale.split("-")[0]).map((l) => l.id as Locale);
  const savePart = async () => {
    const w = partW.trim(), sp = partS.trim();
    if (!w || !sp) return;
    const rows = (partAll ? variants : [locale]).map((loc) => ({ locale: loc, written: w, spoken: sp }));
    const { error } = await supabase.from("pronunciation_rules").upsert(rows, { onConflict: "locale,written" });
    if (error) { toast.error(error.message); return; }
    setPartW(""); setPartS(""); setPartOpen(false);
    await qc.invalidateQueries({ queryKey: pronunciationRulesQueryKey });
    toast.success(t("speak.pronunciationSaved"));
  };
  const removePart = async (id: string) => {
    const { error } = await supabase.from("pronunciation_rules").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    await qc.invalidateQueries({ queryKey: pronunciationRulesQueryKey });
  };
  useEffect(() => { setSpoken(rule?.spoken ?? ""); }, [rule?.spoken]);

  const hear = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) { toast.error(t("speak.unsupported")); return; }
    speakSentences([spoken.trim() || name], locale, 1);
  };
  const save = async () => {
    if (!spoken.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("pronunciation_rules").upsert({ locale, written: rule?.written ?? name, spoken: spoken.trim() }, { onConflict: "locale,written" });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setEditing(false);
    await qc.invalidateQueries({ queryKey: pronunciationRulesQueryKey });
    toast.success(t("speak.pronunciationSaved"));
  };
  const remove = async () => {
    if (!rule) return;
    const { error } = await supabase.from("pronunciation_rules").delete().eq("id", rule.id);
    if (error) { toast.error(error.message); return; }
    setSpoken(""); setEditing(false);
    await qc.invalidateQueries({ queryKey: pronunciationRulesQueryKey });
  };

  return (
    <tr className="align-top">
      <td className="px-3 py-2">
        <div className="font-medium text-foreground">{name}</div>
        <LocaleRuleChips name={name} all={all} current={locale} canEdit={canEdit} />
        {parts.length > 0 && <div className="mt-1 flex flex-wrap gap-1">
          {parts.map((p) => (
            <span key={p.id} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs text-foreground">
              <Puzzle className="h-3 w-3 text-muted-foreground" />{p.written} → {p.spoken}
              {canEdit && <button type="button" aria-label={t("speak.pronunciationDelete", { name: p.written })} onClick={() => void removePart(p.id)} className="text-muted-foreground hover:text-foreground"><Trash2 className="h-3 w-3" /></button>}
            </span>
          ))}
        </div>}
        {partOpen && <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <input autoFocus value={partW} onChange={(e) => setPartW(e.target.value)} placeholder="z. B. Smoothie" aria-label={t("speak.pronunciationWritten")}
            className="h-8 w-32 rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none focus:border-primary" />
          <span className="text-muted-foreground" aria-hidden="true">→</span>
          <input value={partS} onChange={(e) => setPartS(e.target.value)} placeholder={t("speak.pronunciationSpoken")} aria-label={t("speak.pronunciationSpoken")}
            onKeyDown={(e) => { if (e.key === "Enter") void savePart(); if (e.key === "Escape") setPartOpen(false); }}
            className="h-8 w-32 rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none focus:border-primary" />
          <Button type="button" size="sm" variant="outline" className="h-8" onClick={() => speakSentences([partS.trim() || partW], locale, 1)} disabled={!partW.trim() && !partS.trim()}><Volume2 className="h-3.5 w-3.5" /></Button>
          {variants.length > 1 && (
            <Button type="button" size="sm" variant={partAll ? "default" : "outline"} className="h-8 gap-1" title={t("speak.applyToVariants")} aria-label={t("speak.applyToVariants")} aria-pressed={partAll} onClick={() => setPartAll((v) => !v)}>
              <Languages className="h-3.5 w-3.5" />
              <span className="text-[11px]">{partAll ? variants.map((v) => v.split("-")[1]).join("+") : variants.length + "×"}</span>
            </Button>
          )}
          <Button type="button" size="sm" variant="outline" className="h-8" onClick={() => void savePart()} disabled={!partW.trim() || !partS.trim()}><Save className="h-3.5 w-3.5" /></Button>
        </div>}
      </td>
      <td className="px-3 py-2">
        {editing && (
          <input autoFocus value={spoken} onChange={(e) => setSpoken(e.target.value)} placeholder={name}
            onKeyDown={(e) => { if (e.key === "Enter") void save(); if (e.key === "Escape") { setEditing(false); setSpoken(rule?.spoken ?? ""); } }}
            className="mb-1.5 h-9 w-full rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none focus:border-primary" />
        )}
        <div className="flex flex-wrap gap-1.5">
          <Button type="button" size="sm" variant="outline" className="h-8 gap-1" onClick={hear}><Volume2 className="h-3.5 w-3.5" /> ▶</Button>
          {canEdit && <Button type="button" size="sm" variant="outline" className="h-8 gap-1" onClick={() => setEditing((v) => !v)} aria-label={t("speak.pronunciationSpoken")}><Pencil className="h-3.5 w-3.5" /></Button>}
          {canEdit && <Button type="button" size="sm" variant="outline" className="h-8 gap-1" title="Wortteil" onClick={() => setPartOpen((v) => !v)}><Plus className="h-3.5 w-3.5" /><Puzzle className="h-3.5 w-3.5" /></Button>}
          {canEdit && <Button type="button" size="sm" variant="outline" className="h-8 gap-1" disabled={busy || !spoken.trim() || spoken.trim() === rule?.spoken} onClick={() => void save()}><Save className="h-3.5 w-3.5" /></Button>}
          {canEdit && rule && <Button type="button" size="sm" variant="outline" className="h-8" onClick={() => void remove()} aria-label={t("speak.pronunciationDelete", { name })}><Trash2 className="h-3.5 w-3.5" /></Button>}
        </div>
      </td>
    </tr>
  );
}
