import { useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { allLocales } from "@/i18n";
import { translateSingleName } from "@/lib/admin.functions";

const db = supabase as any;
type Row = { id: string; variant: string; locale: string; name: string; is_manual: boolean };

/** Übersetzungs-Knopf + aufklappbarer Bereich je Variante (alle Lokalisierungen, ✨ pro Sprache). */
export function VariantTranslations({ productId, variant, productName, isPrefix, onTogglePrefix }: {
  productId: string; variant: string;
  /** Optional: Reihenfolge pro Sprache festlegen */
  productName?: (locale: string) => string;
  isPrefix?: (locale: string) => boolean;
  onTogglePrefix?: (locale: string) => void;
}) {
  const qc = useQueryClient();
  const key = ["admin-variant-translations", productId];
  const { data = [] } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await db.from("variant_translations").select("id, variant, locale, name, is_manual").eq("product_id", productId);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });
  const rows = Object.fromEntries(data.filter((r) => r.variant === variant).map((r) => [r.locale, r]));
  const locales = allLocales();
  const [open, setOpen] = useState(false);
  const [busyAll, setBusyAll] = useState(false);
  const trFn = useServerFn(translateSingleName);

  const save = async (locale: string, v: string) => {
    const val = v.trim();
    if ((rows[locale]?.name ?? "") === val) return;
    const res = val
      ? await db.from("variant_translations").upsert({ product_id: productId, variant, locale, name: val, is_manual: true }, { onConflict: "product_id,variant,locale" })
      : await db.from("variant_translations").delete().eq("product_id", productId).eq("variant", variant).eq("locale", locale);
    if (res.error) toast.error(res.error.message);
    await qc.invalidateQueries({ queryKey: key });
  };
  const ai = async (locale: string) => {
    const r = await trFn({ data: { name: variant, locale } });
    if (r.name) await save(locale, r.name);
    return r.name;
  };
  const fillAll = async () => {
    setBusyAll(true);
    try { await Promise.all(locales.filter((l) => !rows[l.id]?.name).map((l) => ai(l.id).catch(() => null))); }
    finally { setBusyAll(false); }
  };

  const count = locales.filter((l) => rows[l.id]?.name).length;
  return (
    <>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} title="Übersetzungen"
        className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[11px] ${open ? "border-primary text-foreground" : "border-border text-muted-foreground"}`}>
        🌐 <span className="font-semibold">{count}/{locales.length}</span>
      </button>
      {open && (
        <div className="basis-full space-y-1 pb-1 pl-5" draggable onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}>
          <div className="flex justify-end">
            <button type="button" disabled={busyAll} onClick={() => void fillAll()}
              className="rounded-md border border-border px-2 py-0.5 text-[11px] text-foreground disabled:opacity-50">
              {busyAll ? "…" : "✨ Leere mit KI füllen"}
            </button>
          </div>
          {locales.map((l) => (
            <TrField key={l.id + (rows[l.id]?.name ?? "")} label={`${l.flag} ${l.id}`} value={rows[l.id]?.name ?? ""}
              manual={rows[l.id]?.is_manual} onSave={(v) => void save(l.id, v)} onAi={() => ai(l.id)}
              order={isPrefix && onTogglePrefix ? (() => {
                const vn = rows[l.id]?.name || variant; const pn = productName?.(l.id) ?? "";
                const pre = isPrefix(l.id);
                return (
                  <button type="button" onClick={() => onTogglePrefix(l.id)} aria-pressed={pre}
                    title="Reihenfolge in dieser Sprache: Variante vor oder hinter dem Produktnamen"
                    className={`h-7 max-w-[9rem] truncate rounded-md border px-2 text-[11px] font-medium ${pre ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
                    {pre ? `${vn} ${pn}` : `${pn} ${vn}`}
                  </button>
                );
              })() : null} />
          ))}
        </div>
      )}
    </>
  );
}

function TrField({ label, value, manual, onSave, onAi, order }: { label: string; value: string; manual?: boolean | undefined; onSave: (v: string) => void; onAi: () => Promise<string | undefined>; order?: ReactNode }) {
  const [v, setV] = useState(value);
  const [busy, setBusy] = useState(false);
  return (
    <div className={`grid ${order ? "grid-cols-[5rem_1fr_auto_auto]" : "grid-cols-[5rem_1fr_auto]"} items-center gap-2 text-xs`}>
      <span className="text-muted-foreground">{label}</span>
      <input aria-label={label} value={v} onChange={(e) => setV(e.target.value)} onBlur={() => onSave(v)}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        className={`min-w-0 rounded-md border px-2 py-1 text-sm text-foreground outline-none focus:border-primary ${manual ? "border-primary bg-primary-soft/30" : "border-input bg-background"}`} />
      <button type="button" disabled={busy} aria-label={`KI-Übersetzung ${label}`}
        onClick={async () => { setBusy(true); try { const n = await onAi(); if (n) setV(n); else toast.error("Keine Übersetzung"); } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); } }}
        className="h-7 rounded-md border border-border px-2 text-xs">{busy ? "…" : "✨"}</button>
      {order}
    </div>
  );
}
