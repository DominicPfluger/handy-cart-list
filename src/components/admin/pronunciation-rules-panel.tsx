import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LOCALES, useT, type Locale } from "@/i18n";
import { Button } from "@/components/ui/button";
import { pronunciationRulesQueryKey, usePronunciationRules } from "@/lib/pronunciation-rules";

export function PronunciationRulesPanel({ canEdit }: { canEdit: boolean }) {
  const { t } = useT();
  const queryClient = useQueryClient();
  const { data: rules = [] } = usePronunciationRules();
  const [locale, setLocale] = useState<Locale>("de-DE");
  const [written, setWritten] = useState("");
  const [spoken, setSpoken] = useState("");
  const [saving, setSaving] = useState(false);
  const visible = rules.filter((rule) => rule.locale === locale);
  const refresh = () => queryClient.invalidateQueries({ queryKey: pronunciationRulesQueryKey });

  const add = async () => {
    const cleanWritten = written.trim();
    const cleanSpoken = spoken.trim();
    if (!cleanWritten || !cleanSpoken || !canEdit) return;
    setSaving(true);
    const { error } = await supabase.from("pronunciation_rules").upsert({ locale, written: cleanWritten, spoken: cleanSpoken }, { onConflict: "locale,written" });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setWritten(""); setSpoken("");
    await refresh();
    toast.success(t("speak.pronunciationSaved"));
  };

  const remove = async (id: string) => {
    if (!canEdit) return;
    const { error } = await supabase.from("pronunciation_rules").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    await refresh();
  };

  return (
    <div className="max-w-xl space-y-4">
      <p className="text-sm text-muted-foreground">{t("speak.pronunciationSub")}</p>
      <label className="block text-sm font-semibold text-foreground">
        {t("speak.locale")}
        <select value={locale} onChange={(event) => setLocale(event.target.value as Locale)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
          {LOCALES.map((item) => <option key={item.id} value={item.id}>{item.flag} {item.label}</option>)}
        </select>
      </label>
      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {visible.length === 0 && <p className="px-3 py-4 text-sm text-muted-foreground">{t("speak.pronunciationEmpty")}</p>}
        {visible.map((rule) => (
          <div key={rule.id} className="flex items-center gap-2 px-3 py-2.5">
            <div className="min-w-0 flex-1 text-sm text-foreground"><span className="font-medium">{rule.written}</span><span className="mx-2 text-muted-foreground" aria-hidden="true">→</span><span>{rule.spoken}</span></div>
            {canEdit && <Button type="button" size="icon" variant="outline" onClick={() => void remove(rule.id)} aria-label={t("speak.pronunciationDelete", { name: rule.written })} className="h-9 w-9 shrink-0"><Trash2 className="h-4 w-4" /></Button>}
          </div>
        ))}
      </div>
      {canEdit && <div className="space-y-2 rounded-lg border border-border bg-card p-3">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <input value={written} onChange={(event) => setWritten(event.target.value)} placeholder={t("speak.pronunciationWritten")} aria-label={t("speak.pronunciationWritten")} className="min-w-0 rounded-lg border border-border bg-background px-2 py-2 text-sm text-foreground outline-none focus:border-primary" />
          <span className="text-muted-foreground" aria-hidden="true">→</span>
          <input value={spoken} onChange={(event) => setSpoken(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void add(); }} placeholder={t("speak.pronunciationSpoken")} aria-label={t("speak.pronunciationSpoken")} className="min-w-0 rounded-lg border border-border bg-background px-2 py-2 text-sm text-foreground outline-none focus:border-primary" />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void add()} disabled={saving || !written.trim() || !spoken.trim()} className="w-full gap-2"><Plus className="h-4 w-4" /> {t("speak.pronunciationAdd")}</Button>
      </div>}
    </div>
  );
}