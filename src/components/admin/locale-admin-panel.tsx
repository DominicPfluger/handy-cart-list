import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { listAppLocales, createAppLocale, deleteAppLocale, translateUiBatch, translateMissing } from "@/lib/admin.functions";
import { loadExtraLocales, useT } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Im Admin neue Sprachen anlegen: App-Texte + Katalog werden per KI übersetzt. */
export function LocaleAdminPanel() {
  const { t } = useT();
  const qc = useQueryClient();
  const list = useServerFn(listAppLocales);
  const create = useServerFn(createAppLocale);
  const del = useServerFn(deleteAppLocale);
  const trUi = useServerFn(translateUiBatch);
  const trCat = useServerFn(translateMissing);
  const q = useQuery({ queryKey: ["app-locales"], queryFn: () => list() });
  const [id, setId] = useState("");
  const [label, setLabel] = useState("");
  const [flag, setFlag] = useState("");
  const [progress, setProgress] = useState<string | null>(null);

  const translateAll = async (loc: string) => {
    let done = 0;
    for (let i = 0; i < 30; i++) {
      const r = await trUi({ data: { locale: loc, limit: 150 } });
      done += r.written;
      setProgress(t("loc.progressUi", { n: done, rest: r.remaining }));
      if (r.remaining === 0 || r.written === 0) break;
    }
    let cat = 0;
    for (let i = 0; i < 80; i++) {
      const r = await trCat({ data: { limit: 120 } });
      cat += r.written;
      setProgress(t("loc.progressCat", { n: cat, rest: r.remaining }));
      if (r.remaining === 0 || r.written === 0) break;
    }
  };

  const run = async (loc: string, fn: () => Promise<unknown>) => {
    try {
      setProgress(t("loc.working"));
      await fn();
      await translateAll(loc);
      await loadExtraLocales(true);
      toast.success(t("loc.done"));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setProgress(null);
      await qc.invalidateQueries({ queryKey: ["app-locales"] });
      await qc.invalidateQueries({ queryKey: ["catalog"] });
    }
  };

  const submit = () => {
    const code = id.trim().replace("_", "-");
    const norm = code.length === 5 ? `${code.slice(0, 2).toLowerCase()}-${code.slice(3).toUpperCase()}` : code;
    if (!/^[a-z]{2}-[A-Z]{2}$/.test(norm) || label.trim().length < 2) { toast.error(t("loc.invalid")); return; }
    void run(norm, async () => {
      await create({ data: { id: norm, label: label.trim(), flag: flag.trim() || "🏳️" } });
      setId(""); setLabel(""); setFlag("");
    });
  };

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div>
        <h2 className="text-lg font-bold text-foreground">{t("loc.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("loc.hint")}</p>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <Input aria-label={t("loc.flag")} placeholder="🇵🇱" value={flag} onChange={(e) => setFlag(e.target.value)} className="h-11 w-16 rounded-xl text-center text-xl" />
          <Input aria-label={t("loc.code")} placeholder="pl-PL" value={id} onChange={(e) => setId(e.target.value)} className="h-11 w-28 rounded-xl" />
          <Input aria-label={t("loc.label")} placeholder={t("loc.labelPh")} value={label} onChange={(e) => setLabel(e.target.value)} className="h-11 flex-1 rounded-xl" />
        </div>
        <Button className="h-11 w-full rounded-xl" disabled={Boolean(progress)} onClick={submit}>{t("loc.create")}</Button>
        {progress && <p className="text-sm font-semibold text-primary">{progress}</p>}
      </div>

      {(q.data ?? []).length > 0 && (
        <ul className="divide-y divide-border">
          {q.data!.map((l) => (
            <li key={l.id} className="flex items-center gap-2 py-2 text-sm">
              <span className="text-xl">{l.flag}</span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-foreground">{l.label} <span className="text-muted-foreground">· {l.id}</span></div>
                <div className="text-xs text-muted-foreground">{t("loc.status", { ui: l.ui, total: l.uiTotal, cat: l.catalog })}</div>
              </div>
              <Button size="sm" variant="outline" disabled={Boolean(progress)} onClick={() => void run(l.id, async () => {})}>{t("loc.continue")}</Button>
              <Button size="sm" variant="ghost" className="text-destructive" disabled={Boolean(progress)}
                onClick={() => { if (confirm(t("loc.deleteConfirm", { name: l.label }))) void del({ data: { id: l.id } }).then(() => { void loadExtraLocales(true); return qc.invalidateQueries({ queryKey: ["app-locales"] }); }); }}>✕</Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
