import { useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { forgetCatalogImage } from "@/lib/catalog-image-cache";
import { useT } from "@/i18n";
import { Button } from "@/components/ui/button";

const BUCKET = "catalog-images";
const MAX_EDGE = 1024; // scharf auf Retina-Displays (bis 3x) bei Vollbreite auf Mobilgeräten
const QUALITY = 0.92; // nahezu verlustfrei, keine sichtbaren Artefakte
const AUTO_MIN_BYTES = 200 * 1024; // kleinere Dateien gelten als bereits komprimiert
const MAX_BYTES_PER_PIXEL = 0.6; // darunter ist ein Bild bereits effizient komprimiert

type Obj = { path: string; size: number };

const TXT = {
  de: {
    title: "Grosse Bilder komprimieren & skalieren",
    hint: "Sucht grosse Bilder. Grenze und Qualität werden automatisch gewählt: hohe Qualität ohne sichtbare Artefakte (max. 1024 px). Bereits komprimierte Bilder bleiben unverändert.",
    scan: "Prüfen",
    run: "Jetzt optimieren",
    stop: "Stopp",
    found: (n: number, mb: string) => `${n} grosse Bilder gefunden (${mb} MB)`,
    progress: (d: number, t: number, mb: string) => `${d} / ${t} verarbeitet · ${mb} MB gespart`,
    done: (n: number, mb: string) => `${n} Bilder optimiert, ${mb} MB gespart`,
  },
  en: {
    title: "Compress & resize large images",
    hint: "Finds large images. Limit and quality are chosen automatically: high quality without visible artifacts (max 1024 px). Already compressed images are skipped.",
    scan: "Check",
    run: "Optimize now",
    stop: "Stop",
    found: (n: number, mb: string) => `${n} large images found (${mb} MB)`,
    progress: (d: number, t: number, mb: string) => `${d} / ${t} processed · ${mb} MB saved`,
    done: (n: number, mb: string) => `${n} images optimized, ${mb} MB saved`,
  },
};

const mb = (b: number) => (b / 1e6).toFixed(1);

async function listAll(prefix = ""): Promise<Obj[]> {
  const out: Obj[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000, offset });
    if (error) throw error;
    for (const e of data ?? []) {
      const path = prefix ? `${prefix}/${e.name}` : e.name;
      if (!e.id) out.push(...(await listAll(path)));
      else out.push({ path, size: Number((e.metadata as { size?: number } | null)?.size ?? 0) });
    }
    if (!data || data.length < 1000) break;
  }
  return out;
}

async function shrink(blob: Blob, ext: string): Promise<{ blob: Blob; type: string } | null> {
  const bmp = await createImageBitmap(blob);
  // Bereits komprimiert: klein genug in Pixeln und effizient gespeichert -> unverändert lassen.
  if (Math.max(bmp.width, bmp.height) <= MAX_EDGE && blob.size / (bmp.width * bmp.height) <= MAX_BYTES_PER_PIXEL) { bmp.close(); return null; }
  const scale = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(bmp.width * scale));
  c.height = Math.max(1, Math.round(bmp.height * scale));
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  const type = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "png" ? "image/png" : "image/webp";
  const out = await new Promise<Blob | null>((r) => c.toBlob(r, type, type === "image/png" ? undefined : QUALITY));
  return out ? { blob: out, type } : null;
}

/** Admin: grosse Katalogbilder im Browser verkleinern und unter gleichem Pfad überschreiben. */
export function ImageOptimizer() {
  const { locale } = useT();
  const t = locale.startsWith("de") ? TXT.de : TXT.en;
  const [items, setItems] = useState<Obj[] | null>(null);
  const [busy, setBusy] = useState<"scan" | "run" | null>(null);
  const [prog, setProg] = useState<{ done: number; total: number; saved: number } | null>(null);
  const stop = useRef(false);

  const scan = async () => {
    setBusy("scan");
    try {
      const all = await listAll();
      setItems(all.filter((o) => /\.(png|jpe?g|webp)$/i.test(o.path) && o.size > AUTO_MIN_BYTES).sort((a, b) => b.size - a.size));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally { setBusy(null); }
  };

  const run = async () => {
    if (!items?.length) return;
    setBusy("run"); stop.current = false;
    let done = 0, saved = 0, changed = 0;
    setProg({ done, total: items.length, saved });
    const queue = [...items];
    const worker = async () => {
      while (queue.length && !stop.current) {
        const o = queue.shift()!;
        try {
          const { data, error } = await supabase.storage.from(BUCKET).download(o.path);
          if (error || !data) throw error;
          const ext = o.path.split(".").pop()!.toLowerCase();
          const res = await shrink(data, ext);
          if (res && res.blob.size < data.size * 0.9) {
            const up = await supabase.storage.from(BUCKET).upload(o.path, res.blob, { upsert: true, contentType: res.type, cacheControl: "2592000" });
            if (up.error) throw up.error;
            await forgetCatalogImage(o.path);
            saved += data.size - res.blob.size; changed++;
          }
        } catch (e) { console.warn("optimize failed", o.path, e); }
        setProg({ done: ++done, total: items.length, saved });
      }
    };
    await Promise.all(Array.from({ length: 4 }, worker));
    toast.success(t.done(changed, mb(saved)));
    setBusy(null); setItems(null);
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h2 className="text-base font-semibold">{t.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t.hint}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" disabled={!!busy} onClick={scan}>{busy === "scan" ? "…" : t.scan}</Button>
        <Button size="sm" disabled={!!busy || !items?.length} onClick={run}>{t.run}</Button>
        {busy === "run" && <Button variant="outline" size="sm" onClick={() => { stop.current = true; }}>{t.stop}</Button>}
      </div>
      {items && busy !== "run" && <p className="mt-2 text-sm">{t.found(items.length, mb(items.reduce((s, o) => s + o.size, 0)))}</p>}
      {prog && busy === "run" && (
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${(prog.done / Math.max(1, prog.total)) * 100}%` }} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{t.progress(prog.done, prog.total, mb(prog.saved))}</p>
        </div>
      )}
    </section>
  );
}
