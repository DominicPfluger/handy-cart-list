import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Languages, Plus, Save, Trash2, Volume2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LOCALES, useT, type Locale } from "@/i18n";
import { Button } from "@/components/ui/button";
import { speakSentences } from "@/components/speak-list-button";
import { pronunciationRulesQueryKey, type PronunciationRule } from "@/lib/pronunciation-rules";

/** Chips je Lokalisierung; Klick öffnet die Bearbeitung direkt für diese Sprache. */
export function LocaleRuleChips({ name, all, current, canEdit }: { name: string; all: PronunciationRule[]; current: Locale; canEdit: boolean }) {
  const { t } = useT();
  const qc = useQueryClient();
  const [open, setOpen] = useState<Locale | null>(null);
  const [adding, setAdding] = useState(false);
  const [spoken, setSpoken] = useState("");
  const [busy, setBusy] = useState(false);
  const [allVariants, setAllVariants] = useState(false);
  const sorted = [...all].sort((a, b) => a.locale.localeCompare(b.locale));
  const rule = open ? all.find((r) => r.locale === open) : undefined;
  const missing = LOCALES.filter((l) => !all.some((r) => r.locale === l.id));
  /** Sprachvarianten der offenen Lokalisierung, z. B. de-DE/de-AT/de-CH. */
  const variants = open ? LOCALES.filter((l) => l.id.split("-")[0] === open.split("-")[0]).map((l) => l.id as Locale) : [];

  const select = (l: Locale) => {
    setAdding(false);
    setAllVariants(false);
    if (open === l) { setOpen(null); return; }
    setOpen(l);
    setSpoken(all.find((r) => r.locale === l)?.spoken ?? "");
  };
  const hear = () => {
    if (!open) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) { toast.error(t("speak.unsupported")); return; }
    speakSentences([spoken.trim() || name], open, 1);
  };
  const save = async () => {
    if (!open || !spoken.trim()) return;
    setBusy(true);
    const targets = allVariants ? variants : [open];
    const rows = targets.map((loc) => ({ locale: loc, written: all.find((r) => r.locale === loc)?.written ?? name, spoken: spoken.trim() }));
    const { error } = await supabase.from("pronunciation_rules").upsert(rows, { onConflict: "locale,written" });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    await qc.invalidateQueries({ queryKey: pronunciationRulesQueryKey });
    toast.success(t("speak.pronunciationSaved"));
    setOpen(null);
  };
  const remove = async () => {
    if (!rule) return;
    const { error } = await supabase.from("pronunciation_rules").delete().eq("id", rule.id);
    if (error) { toast.error(error.message); return; }
    await qc.invalidateQueries({ queryKey: pronunciationRulesQueryKey });
    setOpen(null);
  };
  const chipCls = (active: boolean, hl: boolean) =>
    `inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] ${active ? "border-primary bg-primary text-primary-foreground" : hl ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`;

  if (sorted.length === 0 && !canEdit) return null;
  return (
    <div className="mt-1 space-y-1.5">
      <div className="flex flex-wrap gap-1">
        {sorted.map((r) => {
          const info = LOCALES.find((l) => l.id === r.locale);
          return (
            <button key={r.id} type="button" title={info?.label ?? r.locale} onClick={() => select(r.locale as Locale)}
              className={chipCls(open === r.locale, r.locale === current)}>
              <span aria-hidden="true">{info?.flag ?? "🌐"}</span>
              <span className="font-medium">{r.locale.split("-")[1] ?? r.locale}</span>
              <span>{r.spoken}</span>
            </button>
          );
        })}
        {canEdit && missing.length > 0 && (
          <button type="button" onClick={() => { setAdding((v) => !v); setOpen(null); }} className={chipCls(adding, false)} aria-label="+">
            <Plus className="h-3 w-3" />
          </button>
        )}
      </div>
      {adding && (
        <div className="flex flex-wrap gap-1">
          {missing.map((l) => (
            <button key={l.id} type="button" title={l.label} onClick={() => select(l.id)} className={chipCls(false, false)}>
              <span aria-hidden="true">{l.flag}</span><span className="font-medium">{l.id.split("-")[1] ?? l.id}</span>
            </button>
          ))}
        </div>
      )}
      {open && (
        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background p-1.5">
          <span aria-hidden="true">{LOCALES.find((l) => l.id === open)?.flag}</span>
          <input autoFocus value={spoken} disabled={!canEdit} onChange={(e) => setSpoken(e.target.value)} placeholder={name}
            onKeyDown={(e) => { if (e.key === "Enter") void save(); if (e.key === "Escape") setOpen(null); }}
            className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm text-foreground outline-none focus:border-primary" />
          <Button type="button" size="sm" variant="outline" className="h-8 px-2" onClick={hear} aria-label="▶"><Volume2 className="h-3.5 w-3.5" /></Button>
          {canEdit && <Button type="button" size="sm" variant="outline" className="h-8 px-2" disabled={busy || !spoken.trim() || spoken.trim() === rule?.spoken} onClick={() => void save()}><Save className="h-3.5 w-3.5" /></Button>}
          {canEdit && rule && <Button type="button" size="sm" variant="outline" className="h-8 px-2" onClick={() => void remove()} aria-label={t("speak.pronunciationDelete", { name })}><Trash2 className="h-3.5 w-3.5" /></Button>}
          <Button type="button" size="sm" variant="outline" className="h-8 px-2" onClick={() => setOpen(null)} aria-label="✕"><X className="h-3.5 w-3.5" /></Button>
        </div>
      )}
    </div>
  );
}
