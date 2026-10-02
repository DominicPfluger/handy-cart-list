import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getLocale, translate } from "@/i18n";
import type { MessageKey } from "@/i18n/de";

const T = (key: MessageKey, vars?: Record<string, string | number>) => translate(getLocale(), key, vars);

type Alias = { id: string; department_id: string; parent_id: string; sort_order: number };
type Dept = { id: string; name: string; emoji: string | null; parent_id: string | null };

export const KEY = ["admin-dept-aliases"];
export async function loadAliases() {
  const { data, error } = await supabase.from("department_aliases").select("id, department_id, parent_id, sort_order").order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as Alias[];
}

function useAliasActions() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => PromiseLike<{ error: { message: string } | null }>) => {
    setBusy(true);
    try {
      const { error } = await fn();
      if (error) throw new Error(error.message);
      await qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["catalog"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return { busy, run };
}

/** Alle Nachfahren einer Kategorie (für Zyklus-Schutz). */
function descendants(depts: Dept[], id: string): Set<string> {
  const out = new Set<string>([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const d of depts) if (d.parent_id && out.has(d.parent_id) && !out.has(d.id)) { out.add(d.id); grew = true; }
  }
  return out;
}

/** Im Kategorie-Editor: „Auch anzeigen unter…" */
export function DeptAliasEditor({ dept, depts, options }: { dept: Dept; depts: Dept[]; options: { id: string; label: string }[] }) {
  const { data } = useQuery({ queryKey: KEY, queryFn: loadAliases });
  const { busy, run } = useAliasActions();
  const [pick, setPick] = useState("");
  const mine = (data ?? []).filter((a) => a.department_id === dept.id);
  const blocked = descendants(depts, dept.id);
  if (dept.parent_id) blocked.add(dept.parent_id);
  for (const a of mine) blocked.add(a.parent_id);
  const label = (id: string) => options.find((o) => o.id === id)?.label ?? id;

  const add = () => {
    if (!pick) return;
    const siblings = depts.filter((d) => d.parent_id === pick).length + (data ?? []).filter((a) => a.parent_id === pick).length;
    run(() => supabase.from("department_aliases").insert({ department_id: dept.id, parent_id: pick, sort_order: siblings + 1 }));
    setPick("");
  };

  return (
    <div className="space-y-1.5 rounded-xl border border-border p-2">
      <p className="text-xs font-semibold text-foreground">{T("adm.alsoUnder")}</p>
      {mine.map((a) => (
        <div key={a.id} className="flex items-center gap-2 text-xs">
          <span className="min-w-0 flex-1 truncate text-foreground">{label(a.parent_id)}</span>
          <button type="button" disabled={busy} onClick={() => run(() => supabase.from("department_aliases").delete().eq("id", a.id))} className="px-1 text-destructive" aria-label={T("adm.delete")}>✕</button>
        </div>
      ))}
      <div className="flex gap-2">
        <select value={pick} onChange={(e) => setPick(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-xs">
          <option value="">{T("adm.alsoUnderPick")}</option>
          {options.filter((o) => !blocked.has(o.id)).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <button type="button" disabled={busy || !pick} onClick={add} className="rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground disabled:opacity-40">+</button>
      </div>
    </div>
  );
}

