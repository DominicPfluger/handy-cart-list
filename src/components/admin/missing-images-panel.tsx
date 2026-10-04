import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Wand2, WandSparkles, ImageOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { generateImageFor } from "@/lib/product-media.functions";
import { saveProductIconFromPath, saveCustomIconFromPath } from "@/lib/product-icon";
import { useT } from "@/i18n";
import { Button } from "@/components/ui/button";

type Dept = { id: string; name: string; parent_id: string | null };
type Prod = { id: string; name: string; emoji: string | null; department_id: string; image_path: string | null; icon_path?: string | null };
type Filter = "any" | "image" | "icon" | "both";
const PAGE = 5;

/** Pflege: Produkte ohne Vorschaubild/Icon, 30 pro Seite, mit KI-Erzeugung. */
export function MissingImagesPanel({ depts, prods, onEdit }: { depts: Dept[]; prods: Prod[]; onEdit: (id: string) => void }) {
  const { t } = useT();
  const gen = useServerFn(generateImageFor);
  const [filter, setFilter] = useState<Filter>("any");
  const [limit, setLimit] = useState(PAGE);
  const [patch, setPatch] = useState<Record<string, { image_path?: string | null; icon_path?: string | null }>>({});
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [batch, setBatch] = useState<{ done: number; total: number } | null>(null);
  const [batchBoth, setBatchBoth] = useState(false);
  const stop = useRef(false);

  const deptById = useMemo(() => new Map(depts.map((d) => [d.id, d])), [depts]);
  const path = (id: string) => {
    const out: string[] = []; let c = deptById.get(id); let g = 0;
    while (c && g++ < 20) { out.unshift(c.name); c = c.parent_id ? deptById.get(c.parent_id) : undefined; }
    return out.join(" › ");
  };

  const all = useMemo(() => prods.map((p) => ({ ...p, ...patch[p.id] })), [prods, patch]);
  const missing = useMemo(() => all.filter((p) => {
    const noImg = !p.image_path, noIcon = !p.icon_path;
    if (filter === "image") return noImg;
    if (filter === "icon") return noIcon;
    if (filter === "both") return noImg && noIcon;
    return noImg || noIcon;
  }), [all, filter]);
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

  const fix = async (p: Prod, both = false) => {
    setBusy((s) => new Set(s).add(p.id));
    try {
      let image = p.image_path;
      if (!image) image = (await gen({ data: { id: p.id, kind: "product" } })).path;
      if (both) {
        const icon = await gen({ data: { id: p.id, kind: "product", iconOnly: true } });
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

  const fixAll = async () => {
    const list = visible.slice();
    stop.current = false;
    setBatch({ done: 0, total: list.length });
    for (let i = 0; i < list.length; i++) {
      if (stop.current) break;
      if (!(await fix(list[i]!, batchBoth))) break;
      setBatch({ done: i + 1, total: list.length });
    }
    setBatch(null);
  };

  const Thumb = ({ src, size }: { src: string | undefined; size: string }) => (
    <span className={`grid ${size} shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-muted text-muted-foreground`}>
      {src ? <img src={src} alt="" loading="lazy" className="h-full w-full object-contain" /> : <ImageOff className="h-4 w-4" />}
    </span>
  );

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{t("adm.noImg.title")} ({missing.length})</h3>
        <select value={filter} onChange={(e) => { setFilter(e.target.value as Filter); setLimit(PAGE); }} className="rounded-lg border border-input bg-background px-2 py-1 text-xs">
          <option value="any">{t("adm.noImg.any")}</option>
          <option value="image">{t("adm.noImg.image")}</option>
          <option value="icon">{t("adm.noImg.icon")}</option>
          <option value="both">{t("adm.noImg.both")}</option>
        </select>
      </div>
      {visible.length > 0 && (batch ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> {batch.done}/{batch.total}
          <Button size="sm" variant="outline" onClick={() => { stop.current = true; }}>{t("adm.noImg.stop")}</Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={fixAll}><Wand2 className="mr-1 h-4 w-4" />{t("adm.noImg.all", { n: String(visible.length) })}</Button>
          <select value={batchBoth ? "both" : "derive"} onChange={(e) => setBatchBoth(e.target.value === "both")} className="rounded-lg border border-input bg-background px-2 py-1 text-xs" aria-label={t("adm.noImg.batchMode")}>
            <option value="derive">{t("adm.noImg.modeDerive")}</option>
            <option value="both">{t("adm.noImg.modeBoth")}</option>
          </select>
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
            <Button size="icon" variant="ghost" aria-label={t("adm.noImg.gen")} title={t("adm.noImg.gen")} disabled={busy.has(p.id) || !!batch} onClick={() => fix(p)}>
              {busy.has(p.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4 text-primary" />}
            </Button>
          </li>
        ))}
      </ul>
      {missing.length === 0 && <p className="text-xs text-muted-foreground">{t("adm.noImg.none")}</p>}
      {missing.length > limit && (
        <Button size="sm" variant="ghost" className="w-full" onClick={() => setLimit((l) => l + PAGE)}>{t("adm.noImg.more")}</Button>
      )}
    </section>
  );
}
