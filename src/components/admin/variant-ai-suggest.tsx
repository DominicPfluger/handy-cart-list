import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { suggestProductVariants } from "@/lib/admin.functions";
import { translate, getLocale } from "@/i18n";
import type { MessageKey } from "@/i18n/de";

const T = (k: MessageKey) => translate(getLocale(), k);

/** KI-Vorschläge für Varianten im Produkt-Bearbeiten-Dialog; übernommene Chips landen in der Variantenliste. */
export function VariantAiSuggest({ name, category, variants, onAdd }: {
  name: string; category?: string; variants: string[]; onAdd: (v: string[]) => void;
}) {
  const suggest = useServerFn(suggestProductVariants);
  const [list, setList] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const has = (v: string) => variants.some((x) => x.toLowerCase() === v.toLowerCase());

  const run = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const r = await suggest({ data: { name: name.trim(), category: category ?? "", existing: variants } });
      setList(r.variants);
      if (!r.variants.length) toast.info(T("adm.variantAi.none"));
    } catch (e) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  };

  const open = (list ?? []).filter((v) => !has(v));
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled={loading || !name.trim()} onClick={() => void run()}>
          ✨ {loading ? T("adm.working") : list ? T("adm.variantAi.again") : T("adm.variantAi.go")}
        </Button>
        {open.length > 1 && (
          <Button type="button" variant="outline" size="sm" onClick={() => onAdd(open)}>+ {T("adm.variantAi.addAll")}</Button>
        )}
      </div>
      {list && list.length > 0 && (
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-dashed border-primary/40 p-2">
          {list.map((v) => {
            const on = has(v);
            return (
              <button key={v} type="button" disabled={on} onClick={() => onAdd([v])}
                className={`rounded-full border px-2.5 py-1 text-xs ${on ? "border-primary bg-primary/15 text-muted-foreground line-through" : "border-primary/50 bg-background text-foreground"}`}>
                {on ? "✓ " : "✨ "}{v}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
