import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, ImageOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/i18n";
import { deptTreeOrder } from "@/lib/dept-order";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";


type Dept = { id: string; name: string; parent_id: string | null };
type Prod = { id: string; name: string; emoji: string | null; department_id: string; image_path: string | null };
const PAGE = 24;

/** Bilder-Tab: Galerie aller Produktbilder der gewählten Kategorie (inkl. Unterkategorien). */
export function CategoryImageGallery({ depts, prods, onEdit }: { depts: Dept[]; prods: Prod[]; onEdit: (id: string) => void }) {
  const { t } = useT();
  const [cat, setCat] = useState("");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQ, setPickerQ] = useState("");


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
  const pickerNeedle = pickerQ.trim().toLowerCase();
  const pickerItems = useMemo(
    () => (pickerNeedle ? catOptions.filter((c) => c.label.toLowerCase().includes(pickerNeedle)) : catOptions),
    [catOptions, pickerNeedle],
  );
  const catLabel = catOptions.find((c) => c.id === cat)?.label;

  const inCat = (deptId: string) => {
    if (!cat) return false;
    let c = deptById.get(deptId); let g = 0;
    while (c && g++ < 20) { if (c.id === cat) return true; c = c.parent_id ? deptById.get(c.parent_id) : undefined; }
    return false;
  };

  const items = useMemo(
    () => {
      const needle = q.trim().toLowerCase();
      if (!cat && !needle) return [];
      return prods.filter((p) => p.image_path && (!cat || inCat(p.department_id)) && (!needle || p.name.toLowerCase().includes(needle)));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prods, cat, q],
  );
  const visible = items.slice(0, limit);

  const paths = visible.map((p) => p.image_path!).filter(Boolean);
  const imgs = useQuery({
    queryKey: ["gallery-imgs", paths.join("|")],
    enabled: paths.length > 0,
    staleTime: 30 * 60_000,
    queryFn: async () => {
      const { data } = await supabase.storage.from("catalog-images").createSignedUrls(paths, 3600);
      return new Map((data ?? []).filter((e) => e.path && e.signedUrl).map((e) => [e.path!, e.signedUrl]));
    },
  });

  const openPicker = () => { setPickerQ(""); setPickerOpen(true); };
  const pick = (id: string) => { setCat(id); setLimit(PAGE); setPickerOpen(false); };

  return (
    <section className="space-y-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{t("adm.imgGallery.title")}{cat || q.trim() ? ` (${items.length})` : ""}</h3>
        <input
          type="search"
          value={q}
          onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }}
          placeholder={t("adm.noImg.search")}
          aria-label={t("adm.noImg.search")}
          className="w-36 rounded-lg border border-input bg-background px-2 py-1 text-xs"
        />
      </div>
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={openPicker} aria-label={t("adm.imgGallery.title")}
          className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-2 text-left text-sm text-foreground hover:border-primary">
          <span className="min-w-0 flex-1 truncate">{catLabel ?? t("mk.pickCategory")}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </div>
      {!cat && !q.trim() && <p className="text-xs text-muted-foreground">{t("adm.imgGallery.hint")}</p>}
      {(cat || q.trim()) && visible.length === 0 && !imgs.isLoading && <p className="text-xs text-muted-foreground">{t("adm.imgGallery.none")}</p>}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("mk.pickCategory")}</DialogTitle>
          </DialogHeader>
          <input
            type="search"
            value={pickerQ}
            onChange={(e) => setPickerQ(e.target.value)}
            placeholder={t("adm.noImg.search")}
            aria-label={t("adm.noImg.search")}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            autoFocus
          />
          <div className="max-h-[50vh] space-y-0.5 overflow-y-auto pr-1">
            <button type="button" onClick={() => pick("")} aria-label={t("adm.noImg.cat")}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent">
              <span className="min-w-0 flex-1 font-semibold">{t("adm.noImg.cat")}</span>
              {!cat && <Check className="h-4 w-4 text-primary" />}
            </button>
            {pickerItems.map((c) => (
              <button key={c.id} type="button" onClick={() => pick(c.id)} aria-label={c.label}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent">
                <span className="min-w-0 flex-1 truncate">{c.label}</span>
                {cat === c.id && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {visible.map((p) => {
          const src = imgs.data?.get(p.image_path!);
          return (
            <button key={p.id} type="button" onClick={() => onEdit(p.id)} title={p.name}
              className="flex flex-col items-center gap-1 rounded-xl border border-border p-1.5 hover:border-primary hover:bg-primary/5">
              <span className="grid h-20 w-full place-items-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
                {src ? <img src={src} alt="" loading="lazy" className="h-full w-full object-contain" /> : imgs.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageOff className="h-4 w-4" />}
              </span>
              <span className="w-full truncate text-center text-[10px] text-muted-foreground">{p.emoji} {p.name}</span>
            </button>
          );
        })}
      </div>
      {items.length > limit && (
        <Button size="sm" variant="ghost" className="w-full" onClick={() => setLimit((l) => l + PAGE)}>{t("adm.imgGallery.more")}</Button>
      )}
    </section>
  );
}
