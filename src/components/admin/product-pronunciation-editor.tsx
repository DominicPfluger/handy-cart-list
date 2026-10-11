import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useT, type Locale } from "@/i18n";
import { SpeakLocaleChips } from "@/components/admin/speak-locale-chips";
import { Button } from "@/components/ui/button";
import { speakSentences } from "@/components/speak-list-button";
import { pronunciationRulesQueryKey, usePronunciationRules } from "@/lib/pronunciation-rules";

/** Aussprache des Produktnamens für die Sprachausgabe (pro Vorlese-Sprache). */
export function ProductPronunciationEditor({ name, canEdit = true, bare = false }: { name: string; canEdit?: boolean; bare?: boolean }) {
  const { t } = useT();
  const qc = useQueryClient();
  const { data: rules = [] } = usePronunciationRules();
  const [locale, setLocale] = useState<Locale>("de-DE");
  const written = name.trim();
  const rule = rules.find((r) => r.locale === locale && r.written.toLowerCase() === written.toLowerCase());
  const [spoken, setSpoken] = useState(rule?.spoken ?? "");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setSpoken(rule?.spoken ?? ""); }, [rule?.id, rule?.spoken, locale]);

  const hear = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !text.trim()) { toast.error(t("speak.unsupported")); return; }
    speakSentences([text], locale, 1);
  };
  const refresh = () => qc.invalidateQueries({ queryKey: pronunciationRulesQueryKey });
  const save = async () => {
    if (!written || !spoken.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("pronunciation_rules").upsert({ locale, written: rule?.written ?? written, spoken: spoken.trim() }, { onConflict: "locale,written" });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    await refresh();
    toast.success(t("speak.pronunciationSaved"));
  };
  const remove = async () => {
    if (!rule) return;
    const { error } = await supabase.from("pronunciation_rules").delete().eq("id", rule.id);
    if (error) { toast.error(error.message); return; }
    setSpoken("");
    await refresh();
  };

  if (!written) return null;
  return (
    <div className={bare ? "space-y-1.5" : "space-y-1.5 rounded-xl border border-border p-2"}>
      {!bare && (
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">{t("speak.pronunciation")}</h3>
        </div>
      )}
      <SpeakLocaleChips value={locale} onChange={setLocale} />
      <div className="flex items-center gap-2">
        <input value={spoken} disabled={!canEdit} onChange={(e) => setSpoken(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void save(); } }}
          placeholder={written} aria-label={t("speak.pronunciationSpoken")}
          className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none focus:border-primary" />
        <Button type="button" size="icon" variant="outline" aria-label="▶" className="h-10 w-10 shrink-0" onClick={() => hear(spoken.trim() || written)}><Volume2 className="h-4 w-4" /></Button>
        {canEdit && rule && <Button type="button" size="icon" variant="outline" aria-label={t("speak.pronunciationDelete", { name: rule.written })} className="h-10 w-10 shrink-0" onClick={() => void remove()}><Trash2 className="h-4 w-4" /></Button>}
      </div>
      {canEdit && <Button type="button" size="sm" variant="outline" className="w-full" disabled={busy || !spoken.trim() || spoken.trim() === rule?.spoken} onClick={() => void save()}>{t("speak.pronunciationAdd")}</Button>}
    </div>
  );
}
