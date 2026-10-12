import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { translate, getLocale } from "@/i18n";

const db = supabase as any;
const T = (k: "vsyn.button" | "vsyn.placeholder" | "vsyn.exists") => translate(getLocale(), k);

/** Synonym-Knopf + aufklappbarer Bereich (Fragment: Knopf in der Zeile, Bereich als volle Breite). */
export function VariantSynonyms({ productId, variant, defaultOpen }: { productId: string; variant: string; defaultOpen?: boolean }) {
  const qc = useQueryClient();
  const locale = getLocale();
  const key = ["admin-variant-synonyms", productId];
  const { data = [] } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await db.from("variant_synonyms").select("id, variant, locale, term").eq("product_id", productId);
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; variant: string; locale: string; term: string }>;
    },
  });
  const terms = data.filter((r) => r.variant === variant && r.locale === locale);
  const [open, setOpen] = useState(!!defaultOpen);
  const [input, setInput] = useState("");

  const add = async () => {
    const all = input.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
    if (!all.length) return;
    const fresh = all.filter((t, i) => all.findIndex((x) => x.toLowerCase() === t.toLowerCase()) === i && !terms.some((r) => r.term.toLowerCase() === t.toLowerCase()));
    if (!fresh.length) { toast.error(T("vsyn.exists")); return; }
    const { error } = await db.from("variant_synonyms").insert(fresh.map((term) => ({ product_id: productId, variant, locale, term })));
    if (error) { toast.error(error.message); return; }
    setInput("");
    await qc.invalidateQueries({ queryKey: key });
  };
  const remove = async (id: string) => {
    const { error } = await db.from("variant_synonyms").delete().eq("id", id);
    if (error) toast.error(error.message); else await qc.invalidateQueries({ queryKey: key });
  };

  return (
    <>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[11px] ${open ? "border-primary text-foreground" : "border-border text-muted-foreground"}`}>
        {T("vsyn.button")} {terms.length > 0 && <span className="font-semibold">{terms.length}</span>}
      </button>
      {open && (
        <div className="basis-full space-y-1.5 pb-1 pl-5" onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}>
          {terms.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {terms.map((r) => (
                <span key={r.id} className="flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-xs">
                  {r.term}
                  <button type="button" aria-label={`${r.term} ✕`} onClick={() => void remove(r.id)} className="text-muted-foreground hover:text-destructive">✕</button>
                </span>
              ))}
            </div>
          )}
          <input value={input} draggable={false} placeholder={T("vsyn.placeholder")} aria-label={T("vsyn.placeholder")}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void add(); } if (e.key === "Escape") { e.stopPropagation(); setOpen(false); } }}
            className="h-7 w-full rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
        </div>
      )}
    </>
  );
}
