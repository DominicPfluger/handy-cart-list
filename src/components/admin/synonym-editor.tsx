import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { allLocales, getLocale, useT } from "@/i18n";
import { translateProductSynonyms } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Row = { id: string; term: string; locale: string };

/** Synonyme eines Produkts (pro Sprache) – finden das Produkt in der Suche. */
export function ProductSynonymEditor({ productId, bare }: { productId: string; bare?: boolean | undefined }) {
  const { t: T } = useT();
  const [locale, setLocale] = useState<string>(getLocale());
  const [showAll, setShowAll] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const translate = useServerFn(translateProductSynonyms);

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
  const runAi = async () => {
    setAiBusy(true);
    try {
      const r = await translate({ data: { productId } });
      toast.success(T("adm.synTranslated", { n: r.added }));
      await load();
    } catch (e) { toast.error((e as Error).message); } finally { setAiBusy(false); }
  };

  const visible = showAll ? rows : rows.filter((r) => r.locale === locale);
  const hasGerman = rows.some((r) => r.locale.startsWith("de"));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        {!bare ? <h3 className="text-sm font-semibold text-foreground">{T("adm.synonyms")}</h3> : <span />}
        <select value={showAll ? "*" : locale} aria-label={T("adm.synonyms")}
          onChange={(e) => { if (e.target.value === "*") setShowAll(true); else { setShowAll(false); setLocale(e.target.value); } }}
          className="max-w-48 rounded-lg border border-input bg-background px-2 py-1 text-xs">
          <option value="*">🌐 {T("adm.synAllLocales")} ({rows.length})</option>
          {allLocales().map((l) => {
            const n = rows.filter((r) => r.locale === l.id).length;
            return <option key={l.id} value={l.id}>{l.flag} {l.label}{n ? ` (${n})` : ""}</option>;
          })}
        </select>
      </div>
      {visible.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {visible.map((r) => (
            <span key={r.id} className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs">
              {r.term}
              {showAll && <span className="text-muted-foreground">({r.locale})</span>}
              <button type="button" aria-label={`${r.term} ✕`} onClick={() => void remove(r.id)} className="text-muted-foreground hover:text-destructive">✕</button>
            </span>
          ))}
        </div>
      )}
      {!showAll && (
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void add(); }}>
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={T("adm.synonymPlaceholder")} />
          <Button type="submit" variant="outline" disabled={busy || !input.trim()}>+</Button>
        </form>
      )}
      <Button type="button" size="sm" variant="outline" disabled={aiBusy || !hasGerman} onClick={() => void runAi()}>
        {aiBusy ? T("adm.working") : T("adm.synTranslate")}
      </Button>
      <p className="text-[11px] text-muted-foreground">{T("adm.synonymsHint")}</p>
    </div>
  );
}
