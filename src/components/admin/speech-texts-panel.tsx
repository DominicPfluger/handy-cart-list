import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { translate, useT, type Locale } from "@/i18n";
import { SpeakLocaleChips } from "@/components/admin/speak-locale-chips";
import { Button } from "@/components/ui/button";
import { useSpeakLocale } from "@/hooks/use-speak-locale";
import { useSpeakRate } from "@/hooks/use-speak-rate";
import { speakSentences, missingVoice } from "@/components/speak-list-button";
import {
  SPEECH_KEYS, defaultSpeechText, fillSpeech, speechTextsQueryKey, useSpeechTexts, type SpeechKey,
} from "@/lib/speech-texts";

const LABEL: Record<SpeechKey, "stx.intro" | "stx.empty" | "stx.group" | "stx.outro"> = {
  intro: "stx.intro", empty: "stx.empty", group: "stx.group", outro: "stx.outro",
};

export function SpeechTextsPanel() {
  const { t } = useT();
  const qc = useQueryClient();
  const [speakLocale] = useSpeakLocale();
  const [rate] = useSpeakRate();
  const [locale, setLocale] = useState<Locale>("de-DE");
  const { data: rows } = useSpeechTexts();
  const [draft, setDraft] = useState<Record<SpeechKey, string>>({ intro: "", empty: "", group: "", outro: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { setLocale(speakLocale); }, [speakLocale]);
  useEffect(() => {
    const next = {} as Record<SpeechKey, string>;
    for (const k of SPEECH_KEYS) next[k] = rows?.find((r) => r.locale === locale && r.key === k)?.text ?? "";
    setDraft(next);
  }, [rows, locale]);

  const effective = (k: SpeechKey) => draft[k].trim() || defaultSpeechText(locale, k);

  const save = async () => {
    setSaving(true);
    try {
      for (const k of SPEECH_KEYS) {
        const text = draft[k].trim();
        if (text) {
          const { error } = await supabase.from("speech_texts").upsert({ locale, key: k, text }, { onConflict: "locale,key" });
          if (error) throw error;
        } else {
          const { error } = await supabase.from("speech_texts").delete().eq("locale", locale).eq("key", k);
          if (error) throw error;
        }
      }
      await qc.invalidateQueries({ queryKey: speechTextsQueryKey });
      toast.success(t("stx.saved"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const preview = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) { toast.error(t("speak.unsupported")); return; }
    if (missingVoice(locale)) toast.warning(translate(locale, "speak.noVoice"));
    const name = t("stx.sampleList");
    speakSentences([
      fillSpeech(effective("intro"), { name, count: 3 }),
      fillSpeech(effective("group"), { kategorie: t("stx.sampleCat"), artikel: t("stx.sampleItems") }),
      fillSpeech(effective("outro"), { name, count: 3 }),
    ], locale, rate);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("stx.hint")}</p>
      <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">{t("stx.placeholders")}: {"{name}"}, {"{count}"}, {"{kategorie}"}, {"{artikel}"}</p>

      <div className="max-w-xl space-y-4">
        <div className="space-y-1.5">
          <span className="block text-sm font-semibold text-foreground">{t("speak.locale")}</span>
          <SpeakLocaleChips value={locale} onChange={setLocale} marked={(l) => rows?.some((r) => r.locale === l) ?? false} />
        </div>

        {SPEECH_KEYS.map((k) => (
          <div key={k} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">{t(LABEL[k])}</span>
              {draft[k] && (
                <button type="button" onClick={() => setDraft((d) => ({ ...d, [k]: "" }))} className="text-xs text-primary">{t("stx.reset")}</button>
              )}
            </div>
            <textarea
              value={draft[k]}
              onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
              placeholder={defaultSpeechText(locale, k) || t("stx.optional")}
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        ))}

        <div className="flex gap-2">
          <Button variant="outline" onClick={preview}>▶ {t("stx.preview")}</Button>
          <Button onClick={save} disabled={saving} className="flex-1">{t("stx.save")}</Button>
        </div>
      </div>
    </div>
  );
}
