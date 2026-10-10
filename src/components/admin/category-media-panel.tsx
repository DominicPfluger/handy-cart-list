import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { prepareCategoryImage, uploadCategoryImage, deleteCategoryImage } from "@/lib/image-upload";
import { deptTreeOrder } from "@/lib/dept-order";
import { Button } from "@/components/ui/button";
import { ZoomableImage } from "@/components/admin/zoomable-image";

type Dept = { id: string; name: string; emoji?: string | null; parent_id: string | null; image_path: string | null };
type Filter = "all" | "root" | "sub" | "missing" | "has";
const FILTERS: Array<[Filter, string]> = [["all", "Alle"], ["root", "Hauptkategorien"], ["sub", "Unterkategorien"], ["missing", "Ohne Bild"], ["has", "Mit Bild"]];

/** Bilder-Tab „Kategorien": zentrale Kategorie- und Unterkategorie-Bilder, gelten für alle Läden. */
export function CategoryMediaPanel({ depts, onChanged }: { depts: Dept[]; onChanged: () => void }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [patch, setPatch] = useState<Record<string, string | null>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const target = useRef<string | null>(null);

  const byId = useMemo(() => new Map(depts.map((d) => [d.id, d])), [depts]);
  const pathOf = (id: string) => {
    const out: string[] = []; let c = byId.get(id); let g = 0;
    while (c && g++ < 20) { out.unshift(c.name); c = c.parent_id ? byId.get(c.parent_id) : undefined; }
    return out.join(" › ");
  };
  const imgOf = (d: Dept) => (d.id in patch ? patch[d.id] : d.image_path) ?? null;
  const ordered = useMemo(() => deptTreeOrder(depts), [depts]);
  const withImg = depts.filter((d) => imgOf(d)).length;
  const needle = q.trim().toLowerCase();
  const items = ordered.filter((d) => {
    const has = Boolean(imgOf(d));
    if (filter === "root" && d.parent_id) return false;
    if (filter === "sub" && !d.parent_id) return false;
    if (filter === "missing" && has) return false;
    if (filter === "has" && !has) return false;
    return !needle || pathOf(d.id).toLowerCase().includes(needle);
  });
  const [limit, setLimit] = useState(60);
  const visible = items.slice(0, limit);
  const paths = visible.map(imgOf).filter((p): p is string => Boolean(p));
  const urls = useQuery({
    queryKey: ["cat-media-urls", paths.join("|")],
    enabled: paths.length > 0,
    staleTime: 30 * 60_000,
    queryFn: async () => {
      const { data } = await supabase.storage.from("catalog-images").createSignedUrls(paths, 3600);
      return new Map((data ?? []).filter((e) => e.path && e.signedUrl).map((e) => [e.path!, e.signedUrl]));
    },
  });

  const upload = async (file: File) => {
    const id = target.current; if (!id) return;
    setBusy(id);
    try {
      const blob = await prepareCategoryImage(file);
      const path = await uploadCategoryImage(id, blob);
      const { error } = await supabase.from("departments").update({ image_path: path } as never).eq("id", id);
      if (error) throw error;
      setPatch((m) => ({ ...m, [id]: path }));
      onChanged();
      toast.success("Bild gespeichert");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bild konnte nicht gespeichert werden");
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };
  const remove = async (d: Dept) => {
    const p = imgOf(d); if (!p || !window.confirm(`Bild von „${d.name}" entfernen?`)) return;
    setBusy(d.id);
    try {
      const { error } = await supabase.from("departments").update({ image_path: null } as never).eq("id", d.id);
      if (error) throw error;
      await deleteCategoryImage(p).catch(() => undefined);
      setPatch((m) => ({ ...m, [d.id]: null }));
      onChanged();
      toast.success("Bild entfernt");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehler");
    } finally { setBusy(null); }
  };

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <h2 className="text-base font-semibold">Kategorie- & Unterkategorie-Bilder</h2>
      <p className="text-sm text-muted-foreground">Diese Bilder gelten für den gemeinsamen Katalog und stehen allen Laden-Admins zur Verfügung. {withImg} von {depts.length} Kategorien haben ein Bild.</p>
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(([id, label]) => (
          <button key={id} type="button" onClick={() => { setFilter(id); setLimit(60); }} aria-pressed={filter === id}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${filter === id ? "border-primary bg-primary/15 text-foreground" : "border-border bg-background text-muted-foreground"}`}>{label}</button>
        ))}
      </div>
      <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setLimit(60); }} placeholder="Kategorie suchen …" aria-label="Kategorie suchen"
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
      {items.length === 0 && <p className="text-sm text-muted-foreground">Keine Kategorien gefunden.</p>}
      <ul className="divide-y divide-border rounded-xl border border-border">
        {visible.map((d) => {
          const p = imgOf(d); const src = p ? urls.data?.get(p) : undefined;
          return (
            <li key={d.id} className="flex items-center gap-3 p-2">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
                {src ? <ZoomableImage src={src} className="h-full w-full object-cover" /> : <span className="text-2xl">{d.emoji ?? "📁"}</span>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{d.name}</p>
                <p className="truncate text-xs text-muted-foreground">{d.parent_id ? pathOf(d.id) : "Hauptkategorie"}</p>
              </div>
              <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => { target.current = d.id; fileRef.current?.click(); }}>
                {busy === d.id ? "…" : p ? "Ersetzen" : "Hochladen"}
              </Button>
              {p && <Button size="sm" variant="outline" className="text-destructive" disabled={busy !== null} onClick={() => void remove(d)}>Entfernen</Button>}
            </li>
          );
        })}
      </ul>
      {items.length > limit && <Button size="sm" variant="outline" onClick={() => setLimit((l) => l + 60)}>Mehr anzeigen ({items.length - limit})</Button>}
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
    </section>
  );
}
