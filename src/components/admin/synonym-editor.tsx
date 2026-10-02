import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getLocale, useT } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Row = { id: string; term: string; locale: string };

/** Synonyme eines Produkts (pro Sprache) – finden das Produkt in der Suche. */
export function ProductSynonymEditor({ productId }: { productId: string }) {
  const T = useT();
  const locale = getLocale();
  const [rows, setRows] = useState<Row[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("product_synonyms" as never).select("id, term, locale").eq("product_id", productId).order("created_at");
    setRows(((data ?? []) as Row[]));
  };
  useEffect(() => { void load(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const add = async () => {
    const terms = input.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
      .filter((t) => !rows.some((r) => r.locale === locale && r.term.toLowerCase() === t.toLowerCase()));
    if (!terms.length) { setInput(""); return; }
    setBusy(true);
    const { error } = await supabase.from("product_synonyms" as never).insert(terms.map((term) => ({ product_id: productId, locale, term })) as never);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setInput("");
    void load();
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("product_synonyms" as never).delete().eq("id", id);
    if (error) toast.error(error.message); else setRows((x) => x.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-1.5">
      <h3 className="text-sm font-semibold text-foreground">{T("adm.synonyms")}</h3>
      {rows.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {rows.map((r) => (
            <span key={r.id} className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs">
              {r.term}
              {r.locale !== locale && <span className="text-muted-foreground">({r.locale})</span>}
              <button type="button" aria-label={`${r.term} ✕`} onClick={() => void remove(r.id)} className="text-muted-foreground hover:text-destructive">✕</button>
            </span>
          ))}
        </div>
      )}
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void add(); }}>
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={T("adm.synonymPlaceholder")} />
        <Button type="submit" variant="outline" disabled={busy || !input.trim()}>+</Button>
      </form>
      <p className="text-[11px] text-muted-foreground">{T("adm.synonymsHint")}</p>
    </div>
  );
}
