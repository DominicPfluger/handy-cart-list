import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useT } from "../i18n";
import { useSpeakLocale } from "../hooks/use-speak-locale";
import { savePronunciationRules, usePronunciationRules } from "../lib/pronunciation-rules";
import { Button } from "./ui/button";

export function PronunciationRulesSettings() {
  const { t } = useT();
  const [speakLocale] = useSpeakLocale();
  const rules = usePronunciationRules();
  const [open, setOpen] = useState(false);
  const [written, setWritten] = useState("");
  const [spoken, setSpoken] = useState("");
  const visible = rules.filter((rule) => rule.locale === speakLocale);

  const add = () => {
    const cleanWritten = written.trim();
    const cleanSpoken = spoken.trim();
    if (!cleanWritten || !cleanSpoken) return;
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `rule-${Date.now()}`;
    savePronunciationRules([...rules, { id, locale: speakLocale, written: cleanWritten, spoken: cleanSpoken }]);
    setWritten("");
    setSpoken("");
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-muted"
      >
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft/50 text-primary" aria-hidden="true">Aa</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{t("speak.pronunciation")}</p>
          <p className="whitespace-normal text-xs text-muted-foreground">{t("speak.pronunciationSub")}</p>
        </div>
        {visible.length > 0 && <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{visible.length}</span>}
        <span className="text-muted-foreground" aria-hidden="true">{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-border px-4 py-3">
          {visible.map((rule) => (
            <div key={rule.id} className="flex items-center gap-2">
              <div className="min-w-0 flex-1 text-sm text-foreground">
                <span className="font-medium">{rule.written}</span>
                <span className="mx-2 text-muted-foreground" aria-hidden="true">→</span>
                <span>{rule.spoken}</span>
              </div>
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => savePronunciationRules(rules.filter((item) => item.id !== rule.id))}
                aria-label={t("speak.pronunciationDelete", { name: rule.written })}
                className="h-9 w-9 shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <input
              value={written}
              onChange={(event) => setWritten(event.target.value)}
              placeholder={t("speak.pronunciationWritten")}
              aria-label={t("speak.pronunciationWritten")}
              className="min-w-0 rounded-lg border border-border bg-background px-2 py-2 text-sm text-foreground outline-none focus:border-primary"
            />
            <span className="text-muted-foreground" aria-hidden="true">→</span>
            <input
              value={spoken}
              onChange={(event) => setSpoken(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") add(); }}
              placeholder={t("speak.pronunciationSpoken")}
              aria-label={t("speak.pronunciationSpoken")}
              className="min-w-0 rounded-lg border border-border bg-background px-2 py-2 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={add} disabled={!written.trim() || !spoken.trim()} className="w-full gap-2">
            <Plus className="h-4 w-4" /> {t("speak.pronunciationAdd")}
          </Button>
        </div>
      )}
    </div>
  );
}