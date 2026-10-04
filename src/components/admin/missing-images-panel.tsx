import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { WandSparkles, Zap, ImageOff, Loader2, X, Images } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { generateImageFor } from "@/lib/product-media.functions";
import { saveProductIconFromPath, saveCustomIconFromPath } from "@/lib/product-icon";
import { AiImageOptionSelects, DEFAULT_AI_IMAGE_OPTS, type AiImageOpts } from "@/components/admin/ai-image-options";
import { useT } from "@/i18n";
import { deptTreeOrder } from "@/lib/dept-order";
import { Button } from "@/components/ui/button";

type Dept = { id: string; name: string; parent_id: string | null };
type Prod = { id: string; name: string; emoji: string | null; department_id: string; image_path: string | null; icon_path?: string | null };
type Filter = "any" | "image" | "icon" | "both";
type Dlg = { target: Prod | null; hint: string; opts: AiImageOpts; both: boolean };
const PAGE = 5;

/** Pflege: Produkte ohne Vorschaubild/Icon, 5 pro Seite, mit Kategorienfilter und KI-Bildoptionen. */
export function MissingImagesPanel({ depts, prods, onEdit }: { depts: Dept[]; prods: Prod[]; onEdit: (id: string) => void }) {
  const { t } = useT();
  const gen = useServerFn(generateImageFor);
  const [filter, setFilter] = useState<Filter>("any");
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [dlg, setDlg] = useState<Dlg | null>(null);
  const [pick, setPick] = useState<{ target: Prod; query: string } | null>(null);
  const [patch, setPatch] = useState<Record<string, { image_path?: string | null; icon_path?: string | null }>>({});
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [batch, setBatch] = useState<{ done: number; total: number } | null>(null);
  const stop = useRef(false);

  const deptById = useMemo(() => new Map(depts.map((d) => [d.id, d])), [depts]);
  const path = (id: string) => {
    const out: string[] = []; let c = deptById.get(id); let g = 0;
    while (c && g++ < 20) { out.unshift(c.name); c = c.parent_id ? deptById.get(c.parent_id) : undefined; }
    return out.join(" › ");
  };
  const catOptions = useMemo(
    () => deptTreeOrder(depts).map((d) => ({ id: d.id, label: path(d.id) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [depts],
  );
  const inCat = (deptId: string) => {
    if (!cat) return true;
    let c = deptById.get(deptId); let g = 0;
    while (c && g++ < 20) { if (c.id === cat) return true; c = c.parent_id ? deptById.get(c.parent_id) : undefined; }
    return false;
  };

  const all = useMemo(() => prods.map((p) => ({ ...p, ...patch[p.id] })), [prods, patch]);
  const missing = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((p) => {
      const noImg = !p.image_path, noIcon = !p.icon_path;
      const hit = filter === "image" ? noImg : filter === "icon" ? noIcon : filter === "both" ? noImg && noIcon : noImg || noIcon;
      if (!hit) return false;
      if (!inCat(p.department_id)) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || path(p.department_id).toLowerCase().includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, filter, query, cat]);
  const visible = missing.slice(0, limit);

  const paths = visible.flatMap((p) => [p.image_path, p.icon_path]).filter((x): x is string => !!x);
  const imgs = useQuery({
    queryKey: ["missing-imgs", paths.join("|")],
    enabled: paths.length > 0,
    staleTime: 30 * 60_000,
    queryFn: async () => {
      const { data } = await supabase.storage.from("catalog-images").createSignedUrls(paths, 3600);
      return new Map((data ?? []).filter((e) => e.path && e.signedUrl).map((e) => [e.path!, e.signedUrl]));
    },
  });
  const url = (p?: string | null): string | undefined => (p ? imgs.data?.get(p) ?? undefined : undefined);

  const fix = async (p: Prod, both: boolean, hint?: string, opts?: AiImageOpts) => {
    setBusy((s) => new Set(s).add(p.id));
    try {
      let image = p.image_path;
      if (!image) image = (await gen({ data: { id: p.id, kind: "product", hint, opts } })).path;
      if (both) {
        const icon = await gen({ data: { id: p.id, kind: "product", iconOnly: true, hint, opts } });
        await saveCustomIconFromPath("product", p.id, icon.path);
      } else {
        await saveProductIconFromPath(p.id, image);
      }
      const { data } = await supabase.from("products").select("image_path, icon_path").eq("id", p.id).single();
      setPatch((m) => ({ ...m, [p.id]: { image_path: data?.image_path ?? image, icon_path: data?.icon_path ?? null } }));
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
      return false;
    } finally {
      setBusy((s) => { const n = new Set(s); n.delete(p.id); return n; });
    }
  };

  const fixAll = async (both: boolean, hint?: string, opts?: AiImageOpts) => {
    const list = visible.slice();
    stop.current = false;
    setBatch({ done: 0, total: list.length });
    for (let i = 0; i < list.length; i++) {
      if (stop.current) break;
      if (!(await fix(list[i]!, both, hint, opts))) break;
      setBatch({ done: i + 1, total: list.length });
    }
    setBatch(null);
  };

  const runDlg = (d: Dlg) => {
    const h = d.hint.trim() || undefined;
    setDlg(null);
    if (d.target) void fix(d.target, d.both, h, d.opts);
    else void fixAll(d.both, h, d.opts);
  };

  const Thumb = ({ src, size }: { src: string | undefined; size: string }) => (
    <span className={`grid ${size} shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-muted text-muted-foreground`}>
      {src ? <img src={src} alt="" loading="lazy" className="h-full w-full object-contain" /> : <ImageOff className="h-4 w-4" />}
    </span>
  );

  const optionsDialog = (d: Dlg) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDlg(null)}>
      <div className="w-full max-w-sm space-y-3 rounded-2xl bg-card p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-foreground">{t("tile.aiOptions")}</p>
          <Button size="icon" variant="ghost" aria-label={t("adm.cancel")} onClick={() => setDlg(null)}><X className="h-4 w-4" /></Button>
        </div>
        {d.target ? (
          <p className="truncate text-xs text-muted-foreground">{d.target.emoji} {d.target.name}</p>
        ) : (
          <p className="text-xs text-muted-foreground">{t("adm.noImg.all", { n: String(visible.length) })}</p>
        )}
        <label className="block space-y-1 text-xs text-muted-foreground">
          <span>{t("tile.aiHint")}</span>
          <textarea
            maxLength={300}
            rows={3}
            value={d.hint}
            onChange={(e) => setDlg({ ...d, hint: e.target.value })}
            className="w-full rounded-xl border border-input bg-background p-2 text-sm text-foreground"
          />
        </label>
        <AiImageOptionSelects value={d.opts} onChange={(opts) => setDlg({ ...d, opts })} />
        <div className="space-y-1.5" role="radiogroup" aria-label={t("adm.noImg.options")}>
          {([false, true] as const).map((b) => (
            <label key={String(b)} className="flex cursor-pointer items-start gap-2 rounded-xl border border-input p-2 text-xs text-foreground has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input type="radio" name="noimg-mode" checked={d.both === b} onChange={() => setDlg({ ...d, both: b })} className="mt-0.5" />
              <span>{t(b ? "adm.noImg.modeTwo" : "adm.noImg.modeOne")}</span>
            </label>
          ))}
        </div>
        <Button size="sm" className="w-full" disabled={busy.size > 0 || !!batch} onClick={() => runDlg(d)}>{t("adm.noImg.generate")}</Button>
      </div>
    </div>
  );

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{t("adm.noImg.title")} ({missing.length})</h3>
        <div className="flex items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setLimit(PAGE); }}
            placeholder={t("adm.noImg.search")}
            aria-label={t("adm.noImg.search")}
            className="w-36 rounded-lg border border-input bg-background px-2 py-1 text-xs"
          />
          <select value={cat} onChange={(e) => { setCat(e.target.value); setLimit(PAGE); }} className="max-w-40 rounded-lg border border-input bg-background px-2 py-1 text-xs" aria-label={t("adm.noImg.cat")}>
            <option value="">{t("adm.noImg.cat")}</option>
            {catOptions.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <select value={filter} onChange={(e) => { setFilter(e.target.value as Filter); setLimit(PAGE); }} className="rounded-lg border border-input bg-background px-2 py-1 text-xs">
            <option value="any">{t("adm.noImg.any")}</option>
            <option value="image">{t("adm.noImg.image")}</option>
            <option value="icon">{t("adm.noImg.icon")}</option>
            <option value="both">{t("adm.noImg.both")}</option>
          </select>
        </div>
      </div>
      {visible.length > 0 && (batch ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> {batch.done}/{batch.total}
          <Button size="sm" variant="outline" onClick={() => { stop.current = true; }}>{t("adm.noImg.stop")}</Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setDlg({ target: null, hint: "", opts: { ...DEFAULT_AI_IMAGE_OPTS }, both: false })}>
            <WandSparkles className="mr-1 h-4 w-4" />{t("adm.noImg.all", { n: String(visible.length) })}
          </Button>
        </div>
      ))}
      <ul className="divide-y divide-border">
        {visible.map((p) => (
          <li key={p.id} className="flex items-center gap-3 py-2">
            <Thumb src={url(p.image_path)} size="h-14 w-14" />
            <Thumb src={url(p.icon_path)} size="h-8 w-8" />
            <button type="button" onClick={() => onEdit(p.id)} className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-medium text-foreground">{p.emoji} {p.name}</p>
              <p className="truncate text-xs text-muted-foreground">{path(p.department_id)}</p>
            </button>
            <Button size="icon" variant="ghost" aria-label={t("adm.noImg.quick")} title={t("adm.noImg.quick")} disabled={busy.has(p.id) || !!batch} onClick={() => void fix(p, false)}>
              {busy.has(p.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 text-primary" />}
            </Button>
            <Button size="icon" variant="ghost" aria-label={t("adm.noImg.gen")} title={t("adm.noImg.gen")} disabled={busy.has(p.id) || !!batch} onClick={() => setDlg({ target: p, hint: "", opts: { ...DEFAULT_AI_IMAGE_OPTS }, both: false })}>
              {busy.has(p.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4 text-primary" />}
            </Button>
          </li>
        ))}
      </ul>
      {missing.length === 0 && <p className="text-xs text-muted-foreground">{t("adm.noImg.none")}</p>}
      {missing.length > limit && (
        <Button size="sm" variant="ghost" className="w-full" onClick={() => setLimit((l) => l + PAGE)}>{t("adm.noImg.more")}</Button>
      )}
      {dlg && optionsDialog(dlg)}
    </section>
  );
}
