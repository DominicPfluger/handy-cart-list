import { VariantAiSuggest } from "@/components/admin/variant-ai-suggest";
import { VariantSynonyms } from "@/components/admin/variant-synonyms";
import { VariantTranslations } from "@/components/admin/variant-translations";
import { useStandardVariants } from "@/hooks/use-standard-variants";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { allLocales, getLocale, translate } from "@/i18n";
import { AiImageOptionSelects, DEFAULT_AI_IMAGE_OPTS, type AiImageOpts } from "./ai-image-options";
import type { MessageKey } from "@/i18n/de";
import { getUnits } from "@/lib/units";
import { AllowedUnitsPicker } from "@/components/admin/allowed-units-picker";
import { rootColorByName } from "@/lib/dept-colors";
import { deptTreeOrder } from "@/lib/dept-order";
import { prepareCategoryImage } from "@/lib/image-upload";
import { clearCustomIcon, saveCustomIcon, saveCustomIconFromPath, saveProductIcon, setPreviewImageOnly } from "@/lib/product-icon";
import { toast } from "sonner";
import { forgetCatalogImage } from "@/lib/catalog-image-cache";
import { estimateProductPrice, estimateProductPricesAllMarkets, generateImageFor, listProductImages } from "@/lib/product-media.functions";
import { suggestCategoryProducts, suggestImagePrompt, translateSingleName, translateVariants, suggestVariants } from "@/lib/admin.functions";
import { currentMarket, formatRefPrice, type RefPrice } from "@/hooks/use-reference-prices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageZoomOverlay, ZoomableImage } from "@/components/admin/zoomable-image";
import { PreviewCollapse, IconCollapse } from "@/components/admin/preview-collapse";
import { HeadingAiDialog, type HeadingGroup } from "@/components/admin/heading-ai-dialog";
import { ProductPronunciationEditor } from "@/components/admin/product-pronunciation-editor";
import { VariantImageButton } from "@/components/admin/variant-image-button";
import { VariantAiBulkButton } from "@/components/admin/variant-ai-dialog";
import { VariantNameEdit } from "@/components/admin/variant-rename-button";
import { Eye, EyeOff, LayoutGrid, Leaf, List, Loader2, Pencil, Sparkles, Tag, Tags, Trash2 } from "lucide-react";

const T = (key: MessageKey, vars?: Record<string, string | number>) => translate(getLocale(), key, vars);

const MARKET_CCY: Record<string, string> = { CH: "CHF", DE: "EUR", AT: "EUR", FR: "EUR", ES: "EUR", MX: "MXN", IT: "EUR", BE: "EUR", NL: "EUR", GB: "GBP", US: "USD", CA: "CAD", PT: "EUR", BR: "BRL" };

/** Alias-Kategorien: id = "deptalias:<aliasId>", alias_id + dept_id (Original) gesetzt. */
export type TileDept = { id: string; name: string; emoji: string | null; parent_id: string | null; sort_order: number; image_path: string | null; icon_path?: string | null; alias_id?: string; dept_id?: string };
/** Alias-Einträge: id = "alias:<aliasId>", alias_id + product_id gesetzt. */
export type TileProd = { id: string; name: string; emoji: string | null; department_id: string; default_quantity: number; default_unit: string; allowed_units?: string[]; unit_quantities?: Record<string, number>; image_path?: string | null; icon_path?: string | null; variants?: string[]; prefix_variants?: string[]; alias_id?: string; product_id?: string };


type Target = { kind: "department" | "product"; id: string | null } | null;
type Drag = { kind: "department" | "product" | "heading"; id: string; index: number; x: number; y: number; label: string } | null;
export type TileHeading = { id: string; name: string; before_product_id: string };

export function CatalogTileEditor(p: {
  depts: TileDept[];
  cur: string | null;
  setCur: (id: string | null) => void;
  children: TileDept[];
  products: TileProd[];
  path: TileDept[];
  nm: (id: string, base: string) => string;
  unavailable: (prod: TileProd) => boolean;
  prices: Map<string, RefPrice> | undefined;
  run: (fn: () => Promise<unknown>, ok?: string) => Promise<void>;
  must: (q: PromiseLike<{ error: { message: string } | null }>) => Promise<void>;
  translateIds: (ids?: string[]) => Promise<number>;
  reorder: (kind: "department" | "product", list: { id: string }[], from: number, to: number) => void;
  remove: (kind: "department" | "product", id: string, name: string) => void;
  /** Zusätzlicher Inhalt unter dem Editor (z. B. Aliase). */
  below?: React.ReactNode;
  /** Öffnet die erweiterte Bearbeitung (Übersetzungen, Marken, Aliase …). */
  onAdvanced?: (kind: "department" | "product", id: string) => void;
  /** Laden-Modus: Eintrag für diesen Laden aus-/einblenden (nie global löschen). */
  onToggleHidden?: (kind: "department" | "product", id: string) => void;
  /** Laden-Modus: ist der Eintrag für diesen Laden ausgeblendet? */
  isHidden?: (id: string) => boolean;
  busy?: boolean;
  onRemoveAlias?: (aliasId: string, name: string) => void;
  /** Wählbare Kategorien für eine neue Alias-Kategorie. */
  deptAliasOptions?: { id: string; label: string }[];
  onAddDeptAlias?: (deptId: string) => void;
  onRemoveDeptAlias?: (aliasId: string, name: string) => void;
  /** Wählbare Produkte für ein neues Alias-Produkt. */
  productAliasOptions?: { id: string; label: string }[];
  onAddProductAlias?: (productId: string) => void;
  headings?: TileHeading[];
  onAddHeading?: (name: string, insertAt: number) => void;
  onMoveHeading?: (id: string, insertAt: number, mode: "title" | "group") => void;
  onSetHeadingAnchor?: (headingId: string, productId: string) => void;
  /** Produkt an Position `to` (0..n) einfügen und Überschrift `headingId` ("" = keine) zuordnen. */
  onMoveProduct?: (productId: string | string[], to: number, headingId: string) => void;
  /** Ordnet ein Produkt einer Überschrift zu ("" = vor die erste Überschrift). */
  onAssignHeading?: (productId: string, headingId: string) => void;
  onRenameHeading?: (id: string, name: string) => void;
  onDeleteHeading?: (id: string, name: string) => void;
  /** Einträge unterhalb dieser Überschrift nach dem gewählten Kriterium sortieren. */
  onSortHeading?: (id: string) => void;
  onBulkAdd?: (() => void) | undefined;
  onBulkTree?: (() => void) | undefined;
  /** Überschriften der Abteilung in Unterkategorien umwandeln (nur wenn möglich). */
  onHeadingsToSub?: (() => void) | undefined;
  imageEditor?: { kind: "product"; id: string } | null;
  imageEditorProduct?: TileProd | undefined;
  onCloseImageEditor?: () => void;
  /** Ergänzt fehlende Übersetzungen per KI (ganzer Katalog). */
  onTranslateMissing?: () => void;
  /** Löscht alle markierten Produkte (inkl. Produkt-Aliasse). */
  onDeleteSelected?: (sel: { productIds: string[]; productAliasIds: string[] }) => void;
  /** Löscht alle markierten Kategorien (inkl. Kategorie-Aliasse). */
  onDeleteSelectedDepts?: (sel: { deptIds: string[]; deptAliasIds: string[] }) => void;
  /** Übernimmt per KI vorgeschlagene Überschriften-Gruppen. */
  onApplyHeadingGroups?: (groups: HeadingGroup[]) => Promise<void>;
  /** Verschiebt markierte Produkte in eine andere Kategorie. */
  onMoveSelected?: (productIds: string[], deptId: string) => void;
  moveDeptOptions?: { id: string; label: string }[];
}) {
  const [movePick, setMovePick] = useState(false);
  const [moveSearch, setMoveSearch] = useState("");
  const [newTitle, setNewTitle] = useState<string | null>(null);
  const [newTitlePos, setNewTitlePos] = useState(0);
  const headingBefore = useMemo(() => new Map((p.headings ?? []).map((h) => [h.before_product_id, h])), [p.headings]);
  const editMode = true;
  const [target, setTarget] = useState<Target>(null);
  const [priceFocus, setPriceFocus] = useState(false);
  const [drag, setDrag] = useState<Drag>(null);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const allSelRef = useRef<HTMLInputElement>(null);
  const selCount = selected.size;
  const allSelected = p.products.length > 0 && selected.size === p.products.length;
  const [selCur, setSelCur] = useState(p.cur);
  const [selDepts, setSelDepts] = useState<Set<string>>(() => new Set());
  const allDeptSelRef = useRef<HTMLInputElement>(null);
  if (selCur !== p.cur) { setSelCur(p.cur); setSelected(new Set()); setSelDepts(new Set()); }
  const toggleSel = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const selectAll = () => setSelected(new Set(p.products.map((x) => x.id)));
  const clearSelection = () => setSelected(new Set());
  const deptSelCount = selDepts.size;
  const allDeptsSelected = p.children.length > 0 && selDepts.size === p.children.length;
  const toggleDeptSel = (id: string) => setSelDepts((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const selectAllDepts = () => setSelDepts(new Set(p.children.map((x) => x.id)));
  const clearDeptSelection = () => setSelDepts(new Set());
  useEffect(() => { if (allSelRef.current) allSelRef.current.indeterminate = !allSelected && selCount > 0; });
  useEffect(() => { if (allDeptSelRef.current) allDeptSelRef.current.indeterminate = !allDeptsSelected && deptSelCount > 0; });
  const [over, setOver] = useState<string | null>(null);
  const [overPos, setOverPos] = useState<"before" | "after" | null>(null);
  const [headMove, setHeadMove] = useState<{ id: string; name: string; insertAt: number; n: number } | null>(null);
  const [aliasPick, setAliasPick] = useState(false);
  const [aliasSearch, setAliasSearch] = useState("");
  const [prodAliasPick, setProdAliasPick] = useState(false);
  const [prodAliasSearch, setProdAliasSearch] = useState("");
  const [zoom, setZoom] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [variantAdd, setVariantAdd] = useState<TileProd | null>(null);
  const [copyOpen, setCopyOpen] = useState(false);
  const [copyText, setCopyText] = useState("");
  const [deptView, setDeptView] = useState<"tiles" | "list">(() => (localStorage.getItem("shoppi:admin-dept-view") === "list" ? "list" : "tiles"));
  const switchDeptView = (v: "tiles" | "list") => { setDeptView(v); localStorage.setItem("shoppi:admin-dept-view", v); };
  const moved = useRef(false);
  const qc = useQueryClient();
  /** Speichert Standard-Menge/-Einheit direkt aus der Zeile. */
  const saveDefaults = (id: string, patch: { default_quantity?: number; default_unit?: string }) => {
    void p.run(async () => {
      await p.must(supabase.from("products").update(patch as never).eq("id", id));
      await qc.invalidateQueries({ queryKey: ["catalog"] });
    }, T("adm.defaultsSaved"));
  };
  /** Setzt die Mengeneinheit für alle ausgewählten echten Produkte (Aliase ausgeschlossen). */
  const bulkSetUnit = (unit: string) => {
    const ids = [...selected].filter((id) => !id.startsWith("alias:")).map((id) => p.products.find((x) => x.id === id)?.product_id ?? id);
    if (!ids.length) return;
    void p.run(async () => {
      await p.must(supabase.from("products").update({ default_unit: unit } as never).in("id", ids));
      await qc.invalidateQueries({ queryKey: ["catalog"] });
    }, T("adm.defaultsSaved"));
  };
  /** Schaltet die Bio-Variante eines Produkts direkt aus der Zeile um. */
  const toggleBio = (prod: TileProd) => {
    const cur = prod.variants ?? [];
    const has = cur.some((v) => v.toLowerCase() === "bio");
    const next = has ? cur.filter((v) => v.toLowerCase() !== "bio") : [...cur, "Bio"];
    void p.run(async () => {
      await p.must(supabase.from("products").update({ variants: next } as never).eq("id", prod.product_id ?? prod.id));
      await qc.invalidateQueries({ queryKey: ["catalog"] });
    }, T("adm.defaultsSaved"));
  };
  const QTY_OPTIONS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 50, 100, 250, 500];
  const genImgAll = useServerFn(generateImageFor);
  const [imgProg, setImgProg] = useState<{ done: number; total: number } | null>(null);
  const [genAllDlg, setGenAllDlg] = useState<{ all: boolean; hint: string; opts: AiImageOpts } | null>(null);
  const [headingAi, setHeadingAi] = useState(false);
  const generateAllImages = () => {
    const missing = p.products.filter((x) => !x.image_path);
    setGenAllDlg({ all: missing.length === 0, hint: "", opts: { ...DEFAULT_AI_IMAGE_OPTS } });
  };
  const startGenerateAll = () => {
    if (!genAllDlg) return;
    const { all, hint, opts } = genAllDlg;
    const list = all ? p.products : p.products.filter((x) => !x.image_path);
    setGenAllDlg(null);
    if (list.length === 0) return;
    const h = hint.trim() || undefined;
    void p.run(async () => {
      setImgProg({ done: 0, total: list.length });
      try {
        for (let i = 0; i < list.length; i++) {
          await genImgAll({ data: { id: list[i]!.id, kind: "product", hint: h, opts } });
          setImgProg({ done: i + 1, total: list.length });
        }
      } finally { setImgProg(null); }
    }, T("tile.genAllDone", { n: list.length }));
  };
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  /** Erzeugt direkt aus der Zeile ein KI-Bild für ein Produkt (mit Credits-Bestätigung). */
  const quickAiImage = (prod: TileProd) => {
    const name = p.nm(prod.id, prod.name);
    if (!window.confirm(T("adm.variantImageAiConfirm", { name }))) return;
    setAiBusy(prod.id);
    void p.run(async () => {
      try {
        await genImgAll({ data: { id: prod.id, kind: "product" } });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : String(e));
      } finally { setAiBusy(null); }
    });
  };
  const deptById = useMemo(() => new Map(p.depts.map((d) => [d.id, d])), [p.depts]);

  const rootName = (d: TileDept) => {
    let c = d; let g = 0;
    while (c.parent_id && g++ < 20) { const n = deptById.get(c.parent_id); if (!n) break; c = n; }
    return c.name;
  };

  const paths = [...p.children.map((c) => c.image_path), ...p.products.flatMap((x) => [x.icon_path ?? x.image_path, x.image_path])].filter((x, i, a): x is string => Boolean(x) && a.indexOf(x) === i);
  const imgs = useQuery({
    queryKey: ["admin-tile-imgs", paths.join("|")],
    enabled: paths.length > 0,
    staleTime: 30 * 60_000,
    queryFn: async () => {
      const m = new Map<string, string>();
      for (let i = 0; i < paths.length; i += 500) {
        const { data } = await supabase.storage.from("catalog-images").createSignedUrls(paths.slice(i, i + 500), 3600);
        for (const e of data ?? []) if (e.path && e.signedUrl) m.set(e.path, e.signedUrl);
      }
      return m;
    },
  });
  const img = (path: string | null | undefined) => (path ? imgs.data?.get(path) : undefined);

  // ---------- Drag & Drop per Pointer (Maus + Touch) ----------
  const startDrag = (e: React.PointerEvent, kind: "department" | "product" | "heading", id: string, index: number, label: string) => {
    if (!editMode) return;
    e.preventDefault();
    moved.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ kind, id, index, x: e.clientX, y: e.clientY, label });
  };
  const dropAt = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-drop]");
    return el ? { kind: el.dataset["drop"]!, id: el.dataset["id"] ?? "", index: Number(el.dataset["index"] ?? -1), el } : null;
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag) return;
    if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 6) moved.current = true;
    setDrag({ ...drag, x: e.clientX, y: e.clientY });
    const t = dropAt(e.clientX, e.clientY);
    if (t && t.kind === "product" && (drag.kind === "product" || drag.kind === "heading")) {
      const r = t.el.getBoundingClientRect();
      setOverPos(e.clientY > r.top + r.height / 2 ? "after" : "before");
    } else if (t && t.kind === "department" && drag.kind === "department") {
      const r = t.el.getBoundingClientRect();
      const frac = (e.clientX - r.left) / r.width;
      setOverPos(frac >= 0.35 && frac <= 0.65 && !drag.id.startsWith("deptalias:") ? null : frac > 0.5 ? "after" : "before");
    } else setOverPos(null);
    setOver(t ? `${t.kind}:${t.id}` : null);
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag;
    setDrag(null); setOver(null); setOverPos(null);
    if (!d || !moved.current) return;
    const t = dropAt(e.clientX, e.clientY);
    if (!t || t.id === d.id) return;
    const multi = d.kind === "product" && selected.has(d.id) && selected.size > 1;
    if (multi) {
      const ids = p.products.filter((x) => selected.has(x.id)).map((x) => x.id);
      if (t.kind === "product" && selected.has(t.id)) return;
      if ((t.kind === "heading" || t.kind === "product") && p.onMoveProduct) {
        if (t.kind === "heading") p.onMoveProduct(ids, t.index, t.id);
        else {
          const r = t.el.getBoundingClientRect();
          const after = e.clientY > r.top + r.height / 2;
          const anchorH = headingBefore.get(t.id);
          let best = -1; let hid = "";
          for (const h of p.headings ?? []) { const ai = p.products.findIndex((x) => x.id === h.before_product_id); if (ai >= 0 && ai <= t.index && ai > best) { best = ai; hid = h.id; } }
          p.onMoveProduct(ids, t.index + (after ? 1 : 0), !after && anchorH ? anchorH.id : hid);
        }
        setSelected(new Set());
        return;
      }
      if (t.kind === "department" || (t.kind === "crumb" && t.id)) {
        if (p.onMoveSelected) p.onMoveSelected(ids, t.id);
        setSelected(new Set());
      }
      return;
    }
    if (d.kind === "heading") {
      let insertAt: number;
      if (t.kind === "product") {
        const r = t.el.getBoundingClientRect();
        insertAt = t.index + (e.clientY > r.top + r.height / 2 ? 1 : 0);
      } else if (t.kind === "heading") insertAt = t.index;
      else return;
      const h = (p.headings ?? []).find((x) => x.id === d.id);
      if (!h) return;
      const start = p.products.findIndex((x) => x.id === h.before_product_id);
      const anchors = new Set((p.headings ?? []).filter((x) => x.id !== h.id).map((x) => x.before_product_id));
      let end = start + 1;
      if (start >= 0) while (end < p.products.length && !anchors.has(p.products[end]!.id)) end++;
      if (start < 0) { p.onMoveHeading?.(d.id, insertAt, "title"); return; }
      if (insertAt >= start && insertAt <= end) return;
      setHeadMove({ id: h.id, name: p.nm(h.id, h.name), insertAt, n: end - start });
      return;
    }
    if (d.kind === "product" && (t.kind === "heading" || t.kind === "product") && p.onMoveProduct) {
      // Überschrift, zu der eine Listenposition gehört ("" = vor der ersten Überschrift)
      const headOf = (i: number) => {
        let best = -1; let id = "";
        for (const h of p.headings ?? []) { const ai = p.products.findIndex((x) => x.id === h.before_product_id); if (ai >= 0 && ai <= i && ai > best) { best = ai; id = h.id; } }
        return id;
      };
      if (t.kind === "heading") { p.onMoveProduct(d.id, t.index, t.id); return; }
      const r = t.el.getBoundingClientRect();
      const after = e.clientY > r.top + r.height / 2;
      const anchorH = headingBefore.get(t.id);
      // Obere Hälfte des ersten Produkts einer Gruppe = erstes Produkt dieser Gruppe (wie die Linie zeigt)
      const headingId = !after && anchorH ? anchorH.id : headOf(t.index);
      p.onMoveProduct(d.id, t.index + (after ? 1 : 0), headingId);
      return;
    }
    if (d.kind === "product" && t.kind === "heading") {
      p.reorder("product", p.products, d.index, t.index);
      p.onSetHeadingAnchor?.(t.id, d.id);
      return;
    }
    const isAlias = d.id.startsWith("alias:") || d.id.startsWith("deptalias:");
    if (d.id.startsWith("alias:") && d.kind === "product" && (t.kind === "department" || (t.kind === "crumb" && t.id))) {
      if (!t.id.startsWith("deptalias:")) p.onMoveSelected?.([d.id], t.id);
      return;
    }
    if (isAlias && (t.kind === "crumb" || (t.kind === "department" && d.kind !== "department"))) return;
    const after = (() => { const r = t.el.getBoundingClientRect(); return d.kind === "product" ? e.clientY > r.top + r.height / 2 : e.clientX > r.left + r.width / 2; })();
    if (t.kind === "crumb") {
      const dest = t.id || null;
      if (d.kind === "product" && !dest) return;
      void p.run(() => p.must(d.kind === "product"
        ? supabase.from("products").update({ department_id: dest! }).eq("id", d.id)
        : supabase.from("departments").update({ parent_id: dest }).eq("id", d.id)), T("tile.moved"));
    } else if (t.kind === "department" && d.kind === "product") {
      void p.run(() => p.must(supabase.from("products").update({ department_id: t.id }).eq("id", d.id)), T("tile.moved"));
    } else if (t.kind === "department" && d.kind === "department") {
      // Mitte der Kachel = in diese Kategorie hineinverschieben, Rand = umsortieren.
      const r = t.el.getBoundingClientRect();
      const frac = (e.clientX - r.left) / r.width;
      // Nur ein schmaler Mittelbereich verschachtelt; sonst wird umsortiert.
      const into = frac >= 0.35 && frac <= 0.65 && !isAlias && !t.id.startsWith("deptalias:");
      if (into) {
        // Nicht in die eigene Unterkategorie verschieben (würde einen Kreis erzeugen).
        let cur: TileDept | undefined = deptById.get(t.id);
        let cyclic = false; let g = 0;
        while (cur && g++ < 20) { if (cur.id === d.id) { cyclic = true; break; } cur = cur.parent_id ? deptById.get(cur.parent_id) : undefined; }
        if (cyclic) { toast.error(T("tile.moveIntoCycle")); return; }
        void p.run(() => p.must(supabase.from("departments").update({ parent_id: t.id }).eq("id", d.id)), T("tile.moved"));
        return;
      }
      p.reorder("department", p.children, d.index, t.index + (after ? 1 : 0));
    } else if (t.kind === d.kind) {
      p.reorder(d.kind, d.kind === "department" ? p.children : p.products, d.index, t.index + (after ? 1 : 0));
    }
  };

  const dragHandlers = { onPointerMove: onMove, onPointerUp: onUp, onPointerCancel: () => { setDrag(null); setOver(null); setOverPos(null); } };
  const click = (fn: () => void) => () => { if (moved.current) { moved.current = false; return; } fn(); };
  // Icon-Klick öffnet den Dialog erst nach kurzer Verzögerung — ein Doppelklick (Zoom) kann ihn abbrechen
  const iconClickTimer = useRef<number | null>(null);
  const lpTimer = useRef<number | null>(null);
  const lpFired = useRef(false);

  /** Liste der aktuellen Kategorie inkl. aller Unterkategorien als Text (Überschriften als #-Zeilen, Unterkategorien als ##-Gruppen). */
  const collectListText = async (): Promise<string> => {
    if (!p.cur) return "";
    const lines: string[] = [p.path.map((d) => p.nm(d.id, d.name)).join(" › "), ""];
    for (const x of p.products) {
      if (x.alias_id) continue;
      const h = headingBefore.get(x.id);
      if (h) lines.push("", `# ${h.name}`);
      lines.push(p.nm(x.id, x.name));
    }
    const kidsOf = new Map<string, TileDept[]>();
    for (const d of p.depts) {
      if (!d.parent_id) continue;
      const arr = kidsOf.get(d.parent_id) ?? [];
      arr.push(d);
      kidsOf.set(d.parent_id, arr);
    }
    const pathOf = (id: string): string[] => {
      const out: string[] = [];
      let c = deptById.get(id); let g = 0;
      while (c && g++ < 20) { out.unshift(p.nm(c.id, c.name)); c = c.parent_id ? deptById.get(c.parent_id) : undefined; }
      return out;
    };
    const allIds: string[] = [];
    const collectIds = (id: string) => { for (const d of kidsOf.get(id) ?? []) { if (!d.alias_id) { allIds.push(d.id); collectIds(d.id); } } };
    collectIds(p.cur);
    const subProds = new Map<string, { id: string; name: string; sort_order: number }[]>();
    if (allIds.length) {
      const { data } = await supabase.from("products").select("id, name, sort_order, department_id").in("department_id", allIds);
      for (const r of data ?? []) {
        const arr = subProds.get(r.department_id) ?? [];
        arr.push(r);
        subProds.set(r.department_id, arr);
      }
    }
    const walk = (id: string) => {
      for (const d of (kidsOf.get(id) ?? []).sort((a, b) => a.sort_order - b.sort_order)) {
        if (d.alias_id) continue;
        lines.push("", `## ${pathOf(d.id).join(" › ")}`);
        for (const pr of (subProds.get(d.id) ?? []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))) {
          lines.push(p.nm(pr.id, pr.name));
        }
        walk(d.id);
      }
    };
    walk(p.cur);
    return lines.join("\n") + "\n";
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{T("tile.hint")}</p>

      <nav className="flex flex-wrap items-center gap-1 text-sm">
        <button type="button" data-drop="crumb" data-id="" onClick={() => p.setCur(null)}
          className={`rounded-md px-1 font-semibold text-primary ${over === "crumb:" ? "ring-2 ring-primary" : ""}`}>{T("adm.catalog")}</button>
        {p.path.map((d) => (
          <span key={d.id} className="flex items-center gap-1">
            <span className="text-muted-foreground">›</span>
            <button type="button" data-drop="crumb" data-id={d.id} onClick={() => p.setCur(d.id)}
              className={`rounded-md px-1 font-semibold text-primary ${over === `crumb:${d.id}` ? "ring-2 ring-primary" : ""}`}>{p.nm(d.id, d.name)}</button>
          </span>
        ))}
      </nav>


      {editMode && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setTarget({ kind: "department", id: null })}>+ {T("tile.newCat")}</Button>
          {p.cur && <Button size="sm" variant="outline" onClick={() => setTarget({ kind: "department", id: p.cur })}>✎ {T("tile.editCat")}</Button>}
          {p.onAddDeptAlias && <Button size="sm" variant="outline" disabled={!p.cur} title={!p.cur ? T("tile.pickDeptAlias") : undefined} onClick={() => { setAliasSearch(""); setAliasPick(true); }}>+ {T("tile.newDeptAlias")}</Button>}
          {p.cur && p.onAddHeading && p.products.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => { setNewTitle(""); setNewTitlePos(0); }}>+ {T("adm.heading")}</Button>
          )}
          {p.cur && <Button size="sm" variant="outline" onClick={() => setTarget({ kind: "product", id: null })}>+ {T("tile.newProd")}</Button>}
          {p.cur && p.onAddProductAlias && <Button size="sm" variant="outline" onClick={() => { setProdAliasSearch(""); setProdAliasPick(true); }}>+ {T("tile.newProdAlias")}</Button>}
          {p.cur && p.onBulkAdd && <Button size="sm" variant="outline" onClick={p.onBulkAdd}>+ {T("adm.multi")}</Button>}
          {p.onBulkTree && <Button size="sm" variant="outline" onClick={p.onBulkTree}>📂 {T("adm.bulkTree")}</Button>}
          {p.onHeadingsToSub && <Button size="sm" variant="outline" disabled={p.busy} onClick={p.onHeadingsToSub}>📂 {T("adm.headingsToSub")}</Button>}
          {p.cur && <Button size="sm" variant="outline" onClick={() => setSuggesting(true)}>✨ {T("tile.suggest")}</Button>}
          {p.cur && p.products.length > 0 && (
            <Button size="sm" variant="outline" disabled={!!imgProg} onClick={generateAllImages}>
              🖼️ {imgProg ? T("tile.genAllBusy", { done: imgProg.done, total: imgProg.total }) : T("tile.genAll")}
            </Button>
          )}
          {p.cur && p.onApplyHeadingGroups && p.products.length > 0 && (
            <Button size="sm" variant="outline" disabled={p.busy} onClick={() => setHeadingAi(true)} title={T("adm.headingAi.title")}>✨ {T("adm.headingAi.btn")}</Button>
          )}
          {p.cur && (
            <Button size="sm" variant="outline" onClick={() => void collectListText().then((text) => { if (text) { setCopyText(text); setCopyOpen(true); } })}>{T("adm.copyList")}</Button>
          )}
          {p.onTranslateMissing && <Button size="sm" variant="outline" disabled={p.busy} onClick={p.onTranslateMissing}>🌐 {p.busy ? T("adm.working") : T("adm.trMissing")}</Button>}
        </div>
      )}
      {genAllDlg && (() => {
        const missingN = p.products.filter((x) => !x.image_path).length;
        const n = genAllDlg.all ? p.products.length : missingN;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setGenAllDlg(null)}>
            <div className="w-full max-w-sm space-y-3 rounded-2xl bg-card p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <p className="text-sm font-bold text-foreground">{T("tile.genAllTitle")}</p>
              <div className="flex flex-col gap-1 text-sm">
                <label className="flex items-center gap-2"><input type="radio" disabled={missingN === 0} checked={!genAllDlg.all} onChange={() => setGenAllDlg({ ...genAllDlg, all: false })} />{T("tile.genAllMissing", { n: missingN })}</label>
                <label className="flex items-center gap-2"><input type="radio" checked={genAllDlg.all} onChange={() => setGenAllDlg({ ...genAllDlg, all: true })} />{T("tile.genAllEverything", { n: p.products.length })}</label>
              </div>
              <label className="block space-y-1 text-xs text-muted-foreground">
                <span>{T("tile.genAllHint")}</span>
                <textarea maxLength={300} rows={3} value={genAllDlg.hint} onChange={(e) => setGenAllDlg({ ...genAllDlg, hint: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background p-2 text-sm text-foreground" />
              </label>
              <AiImageOptionSelects value={genAllDlg.opts} onChange={(opts) => setGenAllDlg({ ...genAllDlg, opts })} />
              <p className="text-xs text-muted-foreground">{T("adm.aiImagesConfirm", { n })}</p>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setGenAllDlg(null)}>{T("adm.cancel")}</Button>
                <Button disabled={n === 0} onClick={startGenerateAll}>{T("tile.genAllStart")}</Button>
              </div>
            </div>
          </div>
        );
      })()}

      {p.cur && p.onApplyHeadingGroups && headingAi && (
        <HeadingAiDialog open={headingAi} onOpenChange={setHeadingAi} nm={p.nm} hasHeadings={(p.headings ?? []).length > 0}
          path={p.path.map((d) => d.name).join(" › ")}
          products={p.products.filter((x) => !x.id.startsWith("alias:")).map((x) => ({ id: x.id, name: x.name, emoji: x.emoji }))}
          onApply={p.onApplyHeadingGroups} />
      )}

      {p.children.length > 0 && (
        <div className="flex justify-end gap-1">
          <Button type="button" size="sm" variant={deptView === "tiles" ? "default" : "outline"} onClick={() => switchDeptView("tiles")} aria-label={T("tile.viewTiles")} title={T("tile.viewTiles")}><LayoutGrid className="h-3.5 w-3.5" /></Button>
          <Button type="button" size="sm" variant={deptView === "list" ? "default" : "outline"} onClick={() => switchDeptView("list")} aria-label={T("tile.viewList")} title={T("tile.viewList")}><List className="h-3.5 w-3.5" /></Button>
        </div>
      )}

      {(p.children.length > 0 || editMode) && deptView === "tiles" && (
        <div className="grid grid-cols-3 gap-2.5 md:grid-cols-5 xl:grid-cols-7">
          {p.children.map((c, i) => (
             <div key={c.id} data-drop="department" data-id={c.id} data-index={i}
               style={{ background: rootColorByName(rootName(c)) }}
               className={`relative flex flex-col items-center gap-1.5 rounded-2xl bg-primary-soft p-2.5 ${c.alias_id ? "border border-dashed border-border" : ""} ${drag?.id === c.id ? "opacity-40" : ""} ${over === `department:${c.id}` ? (overPos === "before" ? "shadow-[inset_4px_0_0_0_var(--color-primary)]" : overPos === "after" ? "shadow-[inset_-4px_0_0_0_var(--color-primary)]" : "ring-2 ring-primary") : ""}`}>
                <button type="button" aria-label={p.nm(c.dept_id ?? c.id, c.name)}
                onPointerDown={(e) => startDrag(e, "department", c.id, i, c.emoji ?? "📁")} {...dragHandlers}
                onClick={click(() => p.setCur(c.dept_id ?? c.id))}
                onDoubleClick={() => { const u = img(c.image_path); if (u) setZoom(u); }}
                className={`flex h-16 w-full items-center justify-center overflow-hidden rounded-xl text-4xl ${editMode ? "cursor-grab touch-none" : ""}`}>
                {img(c.image_path) ? <ZoomableImage src={img(c.image_path)!} className="h-full w-full object-cover" /> : c.emoji ?? "📁"}
              </button>
              <span className="line-clamp-2 text-center text-[13px] font-bold leading-tight text-foreground">{p.nm(c.dept_id ?? c.id, c.name)}{c.alias_id && <span className="block text-[10px] font-normal text-muted-foreground">· {T("adm.alias")}</span>}</span>
              {editMode && !c.alias_id && (
                <button type="button" onClick={() => setTarget({ kind: "department", id: c.id })} aria-label={T("tile.editItem")}
                  className="absolute right-1 top-1 rounded-full bg-background/80 px-1.5 text-xs">✎</button>
              )}
              {editMode && c.alias_id && (
                <button type="button" onClick={() => p.onRemoveDeptAlias?.(c.alias_id!, p.nm(c.dept_id ?? c.id, c.name))} aria-label={T("adm.delete")}
                  className="absolute right-1 top-1 rounded-full bg-background/80 px-1.5 text-xs text-destructive">✕</button>
              )}
            </div>
          ))}
        </div>
      )}

      {p.children.length > 0 && deptView === "list" && deptSelCount > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-primary-soft px-3 py-2 text-sm">
          <span className="flex-1 font-semibold text-foreground">{T("adm.selectedCount", { n: deptSelCount })}</span>
          <Button size="sm" variant="ghost" onClick={selectAllDepts}>{T("adm.selectAll")}</Button>
          <Button size="sm" variant="ghost" onClick={clearDeptSelection}>{T("adm.clearSelection")}</Button>
          {p.onDeleteSelectedDepts && (
            <Button size="sm" variant="destructive" onClick={() => {
              const deptIds: string[] = []; const deptAliasIds: string[] = [];
              for (const id of selDepts) (id.startsWith("deptalias:") ? deptAliasIds : deptIds).push(id.startsWith("deptalias:") ? id.slice(10) : id);
              p.onDeleteSelectedDepts!({ deptIds, deptAliasIds });
              clearDeptSelection();
            }}>
              <Trash2 className="mr-1 h-3.5 w-3.5" />{T("adm.deleteSelected")}
            </Button>
          )}
        </div>
      )}
      {p.children.length > 0 && deptView === "list" && (
        <label className="flex cursor-pointer items-center gap-2 px-1 py-1 text-sm font-medium text-foreground">
          <input
            ref={allDeptSelRef}
            type="checkbox"
            checked={allDeptsSelected}
            onChange={() => (allDeptsSelected ? clearDeptSelection() : selectAllDepts())}
            className="h-4 w-4 shrink-0 accent-primary"
            aria-label={T("adm.selectAll")}
          />
          {T("adm.selectAll")}
        </label>
      )}
      {p.children.length > 0 && deptView === "list" && (
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {p.children.map((c, i) => (
            <div key={c.id} data-drop="department" data-id={c.id} data-index={i}
              className={`flex items-center gap-3 px-3 py-2 ${c.alias_id ? "border border-dashed border-border" : ""} ${drag?.id === c.id ? "opacity-40" : ""} ${over === `department:${c.id}` ? (overPos === "before" ? "shadow-[inset_0_3px_0_0_var(--color-primary)]" : overPos === "after" ? "shadow-[inset_0_-3px_0_0_var(--color-primary)]" : "ring-2 ring-inset ring-primary") : ""}`}>
              <input type="checkbox" checked={selDepts.has(c.id)} onChange={() => toggleDeptSel(c.id)} aria-label={T("adm.select")} className="h-4 w-4 shrink-0 accent-primary" />
              <span onPointerDown={(e) => startDrag(e, "department", c.id, i, c.emoji ?? "📁")} {...dragHandlers} aria-label={T("adm.drag")} title={T("adm.drag")} className="cursor-grab touch-none select-none px-0.5 text-base text-muted-foreground">⠿</span>
              <button type="button" aria-label={p.nm(c.dept_id ?? c.id, c.name)}
                onClick={click(() => p.setCur(c.dept_id ?? c.id))}
                onDoubleClick={() => { const u = img(c.image_path); if (u) setZoom(u); }}
                className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl text-2xl"
                style={{ background: rootColorByName(rootName(c)) }}>
                {img(c.image_path) ? <ZoomableImage src={img(c.image_path)!} className="h-full w-full object-cover" /> : c.emoji ?? "📁"}
              </button>
              <button type="button" onClick={click(() => p.setCur(c.dept_id ?? c.id))} className="min-w-0 flex-1 text-left">
                <span className="block truncate text-sm font-semibold text-foreground">{p.nm(c.dept_id ?? c.id, c.name)}{c.alias_id && <span className="ml-1 text-[10px] font-normal text-muted-foreground">· {T("adm.alias")}</span>}</span>
              </button>
              {editMode && !c.alias_id && (
                <Button type="button" variant="ghost" size="icon" aria-label={T("tile.editItem")} title={T("tile.editItem")} onClick={() => setTarget({ kind: "department", id: c.id })} className="h-6 w-6 shrink-0 rounded text-muted-foreground hover:text-foreground">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
              {editMode && c.alias_id && (
                <Button type="button" variant="ghost" size="icon" aria-label={T("adm.delete")} title={T("adm.delete")} onClick={() => p.onRemoveDeptAlias?.(c.alias_id!, p.nm(c.dept_id ?? c.id, c.name))} className="h-6 w-6 shrink-0 rounded text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {p.cur && p.onAddHeading && newTitle !== null && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setNewTitle(null)}>
          <form className="flex w-full max-w-sm flex-col gap-2 rounded-t-2xl bg-card p-4 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => { e.preventDefault(); const n = newTitle.trim(); if (!n) return; p.onAddHeading!(n, newTitlePos); setNewTitle(null); }}>
            <p className="text-sm font-bold text-foreground">{T("adm.headingNew")}</p>
            <input autoFocus value={newTitle} maxLength={80} onChange={(e) => setNewTitle(e.target.value)} placeholder={T("adm.heading")}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm" />
            <label className="text-xs font-medium text-muted-foreground" htmlFor="headnew-pos">{T("adm.headingMovePos")}</label>
            <select id="headnew-pos" value={newTitlePos} onChange={(e) => setNewTitlePos(Number(e.target.value))} className="h-11 w-full rounded-xl border border-input bg-background px-2 text-sm">
              {p.products.map((x, i) => (
                <option key={x.id} value={i}>{T("adm.headingMoveBefore", { name: p.nm(x.id, x.name) })}</option>
              ))}
            </select>
            <Button type="submit">{T("adm.save")}</Button>
            <Button type="button" variant="ghost" onClick={() => setNewTitle(null)}>{T("adm.cancel")}</Button>
          </form>
        </div>
      )}

      {selCount === 0 && p.cur && p.onMoveSelected && p.products.length > 0 && (
        <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
          <Button size="sm" variant="outline" disabled>{T("adm.moveSelected")}</Button>
          <span>{T("adm.moveSelectHint")}</span>
        </div>
      )}
      {selCount > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-primary-soft px-3 py-2 text-sm">
          <span className="flex-1 font-semibold text-foreground">{T("adm.selectedCount", { n: selCount })}</span>
          <Button size="sm" variant="ghost" onClick={selectAll}>{T("adm.selectAll")}</Button>
          <Button size="sm" variant="ghost" onClick={clearSelection}>{T("adm.clearSelection")}</Button>
          {p.onMoveSelected && (
            <Button size="sm" variant="outline" onClick={() => { setMoveSearch(""); setMovePick(true); }}>{T("adm.moveSelected")}</Button>
          )}
          {[...selected].some((id) => !id.startsWith("alias:")) && (
            <select
              value=""
              aria-label={T("adm.setUnitSelected")}
              title={T("adm.setUnitSelected")}
              onChange={(e) => { const v = e.target.value; if (v) bulkSetUnit(v); e.target.value = ""; }}
              className="h-8 shrink-0 rounded-lg border border-input bg-background px-1 text-xs text-foreground"
            >
              <option value="" disabled>{T("adm.setUnitSelected")}</option>
              {getUnits(getLocale()).map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
          )}
          {p.onDeleteSelected && (
            <Button size="sm" variant="destructive" onClick={() => {
              const productIds: string[] = []; const productAliasIds: string[] = [];
              for (const id of selected) (id.startsWith("alias:") ? productAliasIds : productIds).push(id.startsWith("alias:") ? id.slice(6) : id);
              p.onDeleteSelected!({ productIds, productAliasIds });
              clearSelection();
            }}>
              <Trash2 className="mr-1 h-3.5 w-3.5" />{T("adm.deleteSelected")}
            </Button>
          )}
        </div>
      )}
      {p.cur && p.products.length > 0 && (
        <div className="flex items-center gap-2 px-1 py-1">
          <label className="flex flex-1 cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
            <input
              ref={allSelRef}
              type="checkbox"
              checked={allSelected}
              onChange={() => (allSelected ? clearSelection() : selectAll())}
              className="h-4 w-4 shrink-0 accent-primary"
              aria-label={T("adm.selectAll")}
            />
            {T("adm.selectAll")}
          </label>
          {p.products.some((x) => !x.id.startsWith("alias:")) && (
            <select
              value=""
              aria-label={T("adm.setUnitAll")}
              title={T("adm.setUnitAll")}
              onChange={(e) => {
                const v = e.target.value; e.target.value = "";
                if (!v) return;
                const ids = [...new Set(p.products.filter((x) => !x.id.startsWith("alias:")).map((x) => x.product_id ?? x.id))];
                const label = getUnits(getLocale()).find((u) => u.id === v)?.label ?? v;
                if (!window.confirm(T("adm.setUnitAllConfirm", { n: ids.length, unit: label }))) return;
                void p.run(async () => {
                  await p.must(supabase.from("products").update({ default_unit: v } as never).in("id", ids));
                  await qc.invalidateQueries({ queryKey: ["catalog"] });
                }, T("adm.defaultsSaved"));
              }}
              className="h-8 shrink-0 rounded-lg border border-input bg-background px-1 text-xs text-foreground"
            >
              <option value="" disabled>{T("adm.setUnitAll")}</option>
              {getUnits(getLocale()).map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
          )}
        </div>
      )}

      {p.cur && (
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {p.products.map((x, i) => {
            const pid = x.product_id ?? x.id;
            const price = p.prices?.get(pid);
            const h = headingBefore.get(x.id);
            return (
              <Fragment key={x.id}>
              {h && (
                <div data-drop="heading" data-id={h.id} data-index={i}
                  className={`flex items-center gap-2 bg-muted/50 px-3 py-2 ${drag?.id === h.id ? "opacity-40" : ""} ${over === `heading:${h.id}` ? "shadow-[inset_0_-3px_0_0_var(--color-primary)]" : ""}`}>
                  {editMode && (
                    <span onPointerDown={(e) => startDrag(e, "heading", h.id, i, p.nm(h.id, h.name))} {...dragHandlers}
                      aria-label={T("adm.drag")} className="cursor-grab touch-none select-none px-1 text-lg text-muted-foreground">⠿</span>
                  )}
                  <button type="button" disabled={!editMode}
                    onClick={click(() => { const n = window.prompt(T("adm.heading"), h.name)?.trim(); if (n && n !== h.name) p.onRenameHeading?.(h.id, n); })}
                    className="min-w-0 flex-1 truncate text-left text-sm font-bold text-foreground">{p.nm(h.id, h.name)}</button>
                  {editMode && p.onSortHeading && (
                    <button type="button" onClick={() => p.onSortHeading!(h.id)} aria-label={T("adm.sortGroup")} title={T("adm.sortGroup")}
                      className="rounded-full px-1.5 text-sm text-muted-foreground">↕</button>
                  )}
                  {editMode && (
                    <button type="button" onClick={() => p.onDeleteHeading?.(h.id, h.name)} aria-label={T("adm.delete")}
                      className="rounded-full px-2 text-xs text-muted-foreground">✕</button>
                  )}
                </div>
              )}
              <div data-drop="product" data-id={x.id} data-index={i}
                className={`flex items-center gap-3 px-3 py-2 ${x.alias_id ? "border border-dashed border-border" : ""} ${drag?.id === x.id ? "opacity-40" : ""} ${over === `product:${x.id}` ? (overPos === "after" ? "shadow-[inset_0_-3px_0_0_var(--color-primary)]" : overPos === "before" ? "shadow-[inset_0_3px_0_0_var(--color-primary)]" : "bg-primary-soft") : ""} ${p.unavailable(x) ? "opacity-50" : ""}`}>
                <input type="checkbox" checked={selected.has(x.id)} onChange={() => toggleSel(x.id)} aria-label={T("adm.select")} className="h-4 w-4 shrink-0 accent-primary" />
                <span onPointerDown={(e) => startDrag(e, "product", x.id, i, (x.emoji ?? "•") + (selected.has(x.id) && selected.size > 1 ? ` +${selected.size - 1}` : ""))} {...dragHandlers} aria-label={T("adm.drag")} title={T("adm.drag")} className="cursor-grab touch-none select-none px-0.5 text-base text-muted-foreground">⠿</span>
                <span
                  onPointerDown={(e) => {
                    if (!editMode) return;
                    lpFired.current = false;
                    if (lpTimer.current !== null) window.clearTimeout(lpTimer.current);
                    const el = e.currentTarget as HTMLElement;
                    const pointerId = e.pointerId;
                    const cx = e.clientX; const cy = e.clientY;
                    const label = (x.emoji ?? "•") + (selected.has(x.id) && selected.size > 1 ? ` +${selected.size - 1}` : "");
                    lpTimer.current = window.setTimeout(() => {
                      lpTimer.current = null;
                      lpFired.current = true;
                      moved.current = false;
                      try { el.setPointerCapture(pointerId); } catch { /* ignore */ }
                      setDrag({ kind: "product", id: x.id, index: i, x: cx, y: cy, label });
                    }, 500);
                  }}
                  onPointerMove={(e) => { if (lpTimer.current !== null) { window.clearTimeout(lpTimer.current); lpTimer.current = null; } onMove(e); }}
                  onPointerUp={(e) => { if (lpTimer.current !== null) { window.clearTimeout(lpTimer.current); lpTimer.current = null; } onUp(e); }}
                  onPointerCancel={() => { if (lpTimer.current !== null) { window.clearTimeout(lpTimer.current); lpTimer.current = null; } setDrag(null); setOver(null); setOverPos(null); }}
                  onClick={() => { if (lpFired.current) { lpFired.current = false; return; } if (iconClickTimer.current !== null) { window.clearTimeout(iconClickTimer.current); iconClickTimer.current = null; return; } iconClickTimer.current = window.setTimeout(() => { iconClickTimer.current = null; if (x.alias_id) p.onAdvanced?.("product", pid); else setTarget({ kind: "product", id: x.id }); }, 260); }} onDoubleClick={() => { if (iconClickTimer.current !== null) { window.clearTimeout(iconClickTimer.current); iconClickTimer.current = null; } const u = img(x.image_path); if (u) setZoom(u); }}
                  className="flex h-11 w-11 shrink-0 touch-none select-none items-center justify-center overflow-hidden rounded-xl bg-muted text-2xl">
                  {img(x.icon_path ?? x.image_path) ? <ZoomableImage src={img(x.icon_path ?? x.image_path)!} className="h-full w-full object-contain" /> : x.emoji ?? "🛒"}
                </span>
                <button type="button" disabled={!editMode} onClick={click(() => x.alias_id ? p.onAdvanced?.("product", pid) : setTarget({ kind: "product", id: x.id }))} className="min-w-0 flex-1 text-left">
                  <div className="truncate text-sm font-semibold text-foreground" title={p.nm(pid, x.name)}>{p.nm(pid, x.name)}{x.alias_id && <span className="ml-1 text-[10px] font-normal text-muted-foreground">· {T("adm.alias")}</span>}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {x.default_quantity} {getUnits(getLocale()).find((u) => u.id === x.default_unit)?.label ?? x.default_unit}
                    {price ? ` · ${formatRefPrice(price)}` : ""}
                  </div>
                </button>
                <select
                  value={String(x.default_quantity)}
                  disabled={!editMode || Boolean(x.alias_id)}
                  aria-label={T("adm.defaultQty")}
                  title={T("adm.defaultQty")}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => { const v = Number(e.target.value); if (v !== x.default_quantity) saveDefaults(pid, { default_quantity: v }); }}
                  className="h-7 w-[4.2rem] shrink-0 rounded-lg border border-input bg-background px-1 text-xs text-foreground"
                >
                  {(QTY_OPTIONS.includes(x.default_quantity) ? QTY_OPTIONS : [...QTY_OPTIONS, x.default_quantity].sort((a, b) => a - b)).map((q) => (
                    <option key={q} value={String(q)}>{q}</option>
                  ))}
                </select>
                <select
                  value={x.default_unit}
                  disabled={!editMode || Boolean(x.alias_id)}
                  aria-label={T("adm.defaultUnit")}
                  title={T("adm.defaultUnit")}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => { const v = e.target.value; if (v !== x.default_unit) saveDefaults(pid, { default_unit: v }); }}
                  className="h-7 w-[5.5rem] shrink-0 rounded-lg border border-input bg-background px-1 text-xs text-foreground"
                >
                  {getUnits(getLocale()).map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
                  {!getUnits(getLocale()).some((u) => u.id === x.default_unit) && <option value={x.default_unit}>{x.default_unit}</option>}
                </select>
                <Button type="button" variant="ghost" size="icon" disabled={!editMode} aria-label={T("tile.advanced")} title={T("tile.advanced")} onClick={() => p.onAdvanced?.("product", pid)} className="h-6 w-6 shrink-0 rounded text-muted-foreground hover:text-foreground">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button type="button" variant="ghost" size="icon" disabled={!editMode} aria-label={T("adm.estimatePrice")} title={T("adm.estimatePrice")} onClick={() => { setPriceFocus(true); setTarget({ kind: "product", id: pid }); }} className="h-6 w-6 shrink-0 rounded text-muted-foreground hover:text-foreground">
                  <Tag className="h-3.5 w-3.5" />
                </Button>
                <Button type="button" variant="ghost" size="icon" disabled={!editMode} aria-label={T("adm.variantAdd")} title={T("adm.variantAdd")} onClick={() => setVariantAdd(p.products.find((y) => y.id === pid) ?? x)} className="h-6 w-6 shrink-0 rounded text-muted-foreground hover:text-foreground">
                  <Tags className="h-3.5 w-3.5" />
                </Button>
                {!x.alias_id && (
                  <Button type="button" variant="ghost" size="icon" disabled={!editMode} aria-label="Bio" title="Bio-Variante umschalten" onClick={() => toggleBio(x)} className={`h-6 w-6 shrink-0 rounded ${(x.variants ?? []).some((v) => v.toLowerCase() === "bio") ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                    <Leaf className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button type="button" variant="ghost" size="icon" disabled={!editMode || aiBusy === pid} aria-label={T("tile.aiImage")} title={T("tile.aiImage")} onClick={() => quickAiImage(p.products.find((y) => y.id === pid) ?? x)} className="h-6 w-6 shrink-0 rounded text-muted-foreground hover:text-foreground">
                  {aiBusy === pid ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                </Button>
                <Button type="button" variant="ghost" size="icon" disabled={!editMode} aria-label={T("adm.delete")} title={T("adm.delete")} onClick={() => x.alias_id ? p.onRemoveAlias?.(x.alias_id, p.nm(pid, x.name)) : p.remove("product", x.id, p.nm(pid, x.name))} className="h-6 w-6 shrink-0 rounded text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {!x.alias_id && (x.variants ?? []).length > 0 && (
                <div className="flex flex-wrap items-center gap-1 bg-primary-soft/40 py-1.5 pl-14 pr-3">
                  <Tags className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
                  {(x.variants ?? []).map((v) => (
                    <button key={v} type="button" disabled={!editMode}
                      onClick={() => setTarget({ kind: "product", id: x.id })}
                      className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
                      {v}
                    </button>
                  ))}
                </div>
              )}
              </Fragment>
            );
          })}
        </div>
      )}

      {p.below}

      {suggesting && p.cur && <SuggestSheet {...p} cur={p.cur} onClose={() => setSuggesting(false)} />}

      {copyOpen && p.cur && <CopyListDialog title={p.path.map((d) => p.nm(d.id, d.name)).join(" › ")} text={copyText} onClose={() => setCopyOpen(false)} />}

      {variantAdd && <VariantAddDialog prod={variantAdd} run={p.run} must={p.must} nm={p.nm} onClose={() => setVariantAdd(null)} />}

      {headMove && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setHeadMove(null)}>
          <div className="flex w-full max-w-sm flex-col gap-2 rounded-t-2xl bg-card p-4 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-bold text-foreground">{T("adm.headingMoveTitle", { name: headMove.name })}</p>
            <label className="text-xs font-medium text-muted-foreground" htmlFor="headmove-pos">{T("adm.headingMovePos")}</label>
            <select id="headmove-pos" value={headMove.insertAt} onChange={(e) => setHeadMove({ ...headMove, insertAt: Number(e.target.value) })} className="h-11 w-full rounded-xl border border-input bg-background px-2 text-sm">
              {p.products.map((x, i) => (
                <option key={x.id} value={i}>{T("adm.headingMoveBefore", { name: p.nm(x.id, x.name) })}</option>
              ))}
              <option value={p.products.length}>{T("adm.headingMoveEnd")}</option>
            </select>
            <Button variant="outline" disabled={!p.products.slice(headMove.insertAt).some((x) => !x.id.startsWith("alias:"))} onClick={() => { p.onMoveHeading?.(headMove.id, headMove.insertAt, "title"); setHeadMove(null); }}>{T("adm.headingMoveOnly")}</Button>
            <Button onClick={() => { p.onMoveHeading?.(headMove.id, headMove.insertAt, "group"); setHeadMove(null); }}>{T("adm.headingMoveGroup", { n: headMove.n })}</Button>
            <Button variant="ghost" onClick={() => setHeadMove(null)}>{T("adm.cancel")}</Button>
          </div>
        </div>
      )}

      {movePick && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setMovePick(false)}>
          <div className="flex max-h-[80vh] w-full max-w-md flex-col gap-2 rounded-t-2xl bg-card p-4 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-bold text-foreground">{T("adm.moveSelectedTitle", { n: selected.size })}</p>
            <Input autoFocus value={moveSearch} onChange={(e) => setMoveSearch(e.target.value)} placeholder={T("adm.search")} className="h-10 rounded-xl" />
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
              {(p.moveDeptOptions ?? []).filter((o) => o.id !== p.cur && o.label.toLowerCase().includes(moveSearch.trim().toLowerCase())).map((o) => (
                <button key={o.id} type="button" onClick={() => { p.onMoveSelected!([...selected], o.id); setMovePick(false); clearSelection(); }}
                  className="w-full truncate rounded-lg border border-border px-3 py-2 text-left text-sm text-foreground">{o.label}</button>
              ))}
            </div>
            <Button variant="outline" onClick={() => setMovePick(false)}>{T("adm.cancel")}</Button>
          </div>
        </div>
      )}

      {aliasPick && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setAliasPick(false)}>
          <div className="flex max-h-[80vh] w-full max-w-md flex-col gap-2 rounded-t-2xl bg-card p-4 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-bold text-foreground">{T("tile.pickDeptAlias")}</p>
            <Input autoFocus value={aliasSearch} onChange={(e) => setAliasSearch(e.target.value)} placeholder={T("tile.deptAliasSearch")} className="h-10 rounded-xl" />
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
              {(p.deptAliasOptions ?? []).filter((o) => o.label.toLowerCase().includes(aliasSearch.trim().toLowerCase())).map((o) => (
                <button key={o.id} type="button" onClick={() => { p.onAddDeptAlias?.(o.id); setAliasPick(false); }}
                  className="w-full truncate rounded-lg border border-border px-3 py-2 text-left text-sm text-foreground">{o.label}</button>
              ))}
              {(p.deptAliasOptions ?? []).length === 0 && <p className="text-sm text-muted-foreground">{T("adm.noHits")}</p>}
            </div>
            <Button variant="outline" onClick={() => setAliasPick(false)}>{T("adm.cancel")}</Button>
          </div>
        </div>
      )}

      {prodAliasPick && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setProdAliasPick(false)}>
          <div className="flex max-h-[80vh] w-full max-w-md flex-col gap-2 rounded-t-2xl bg-card p-4 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-bold text-foreground">{T("tile.pickProdAlias")}</p>
            <Input autoFocus value={prodAliasSearch} onChange={(e) => setProdAliasSearch(e.target.value)} placeholder={T("tile.prodAliasSearch")} className="h-10 rounded-xl" />
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
              {(p.productAliasOptions ?? []).filter((o) => o.label.toLowerCase().includes(prodAliasSearch.trim().toLowerCase())).map((o) => (
                <button key={o.id} type="button" onClick={() => { p.onAddProductAlias?.(o.id); setProdAliasPick(false); }}
                  className="w-full truncate rounded-lg border border-border px-3 py-2 text-left text-sm text-foreground">{o.label}</button>
              ))}
              {(p.productAliasOptions ?? []).length === 0 && <p className="text-sm text-muted-foreground">{T("adm.noHits")}</p>}
            </div>
            <Button variant="outline" onClick={() => setProdAliasPick(false)}>{T("adm.cancel")}</Button>
          </div>
        </div>
      )}

      {drag && moved.current && (
        <div className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-card px-3 py-2 text-2xl shadow-lg" style={{ left: drag.x, top: drag.y }}>{drag.label}</div>
      )}

      {(() => {
        const active = p.imageEditor ?? target;
        if (!active) return null;
        return <ItemSheet key={`${active.kind}:${active.id}`} {...p} target={active} imageOnly={Boolean(p.imageEditor)} openPrices={priceFocus && !p.imageEditor}
          onClose={() => { setPriceFocus(false); if (p.imageEditor) p.onCloseImageEditor?.(); else setTarget(null); }}
          imgUrl={active.id ? img(active.kind === "department" ? deptById.get(active.id)?.image_path : p.products.find((x) => x.id === active.id)?.image_path ?? p.imageEditorProduct?.image_path) : undefined} />;
      })()}

      {zoom && <ImageZoomOverlay src={zoom} open onClose={() => setZoom(null)} />}
    </div>
  );
}

function ItemSheet(p: Parameters<typeof CatalogTileEditor>[0] & { target: NonNullable<Target>; onClose: () => void; imgUrl: string | undefined; imageOnly?: boolean; openPrices?: boolean }) {
  const genImg = useServerFn(generateImageFor);
  const trVariants = useServerFn(translateVariants);
  const suggestPrompt = useServerFn(suggestImagePrompt);
  const isDept = p.target.kind === "department";
  const item = p.target.id ? (isDept ? p.depts.find((d) => d.id === p.target.id) : p.products.find((x) => x.id === p.target.id) ?? p.imageEditorProduct) : undefined;
  const prod = !isDept ? (item as TileProd | undefined) : undefined;
  const [name, setName] = useState(item?.name ?? "");
  const [emoji, setEmoji] = useState(item?.emoji ?? "");
  const [qty, setQty] = useState(prod?.default_quantity ?? 1);
  const [unit, setUnit] = useState(prod?.default_unit ?? "stueck");
  const [allowedUnits, setAllowedUnits] = useState<string[]>(prod?.allowed_units ?? []);
  const [unitQuantities, setUnitQuantities] = useState<Record<string, number>>({ ...(prod?.unit_quantities ?? {}), [prod?.default_unit ?? "stueck"]: prod?.default_quantity ?? 1 });
  const [hint, setHint] = useState("");
  const [imgOpts, setImgOpts] = useState<AiImageOpts>(DEFAULT_AI_IMAGE_OPTS);
  const [iconHint, setIconHint] = useState("");
  const [iconImgOpts, setIconImgOpts] = useState<AiImageOpts>(DEFAULT_AI_IMAGE_OPTS);
  const [large, setLarge] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null | undefined>(undefined);
  const [imageBusy, setImageBusy] = useState(false);
  const iconFileRef = useRef<HTMLInputElement>(null);
  const [iconInfo, setIconInfo] = useState<{ url: string | null; custom: boolean }>({ url: null, custom: false });
  const [imgPath, setImgPath] = useState<string | null>(null);
  const [iconPicking, setIconPicking] = useState(false);
  const loadIcon = async (id: string) => {
    const { data } = await supabase.from(isDept ? "departments" : "products").select("icon_path, icon_custom, image_path").eq("id", id).single();
    const path = (data as { icon_path: string | null } | null)?.icon_path ?? null;
    const signed = path ? (await supabase.storage.from("catalog-images").createSignedUrl(path, 600)).data?.signedUrl ?? null : null;
    setIconInfo({ url: signed, custom: Boolean((data as { icon_custom?: boolean } | null)?.icon_custom) });
    setImgPath((data as { image_path: string | null } | null)?.image_path ?? null);
  };
  const fileRef = useRef<HTMLInputElement>(null);
  const [picking, setPicking] = useState(false);
  const [newId, setNewId] = useState<string | null>(null);
  // Kategorie-Wahl beim Anlegen eines neuen Produkts (Vorauswahl: aktuell geöffnete Kategorie)
  const [newDept, setNewDept] = useState<string>((prod?.alias_id ? p.cur : prod?.department_id) ?? p.cur ?? "");
  const newDeptOpts = (() => {
    const byId = new Map(p.depts.map((d) => [d.id, d]));
    const label = (id: string) => {
      const parts: string[] = [];
      let c = byId.get(id);
      while (c) { parts.unshift(c.name); c = c.parent_id ? byId.get(c.parent_id) : undefined; }
      return parts.join(" › ");
    };
    return deptTreeOrder(p.depts).map((d) => ({ id: d.id, label: label(d.id) }));
  })();
  const [price, setPrice] = useState("");
  const estAll = useServerFn(estimateProductPricesAllMarkets);
  const estOneFn = useServerFn(estimateProductPrice);
  const [estOne, setEstOne] = useState<string | null>(null);
  const qc = useQueryClient();
  const [estimating, setEstimating] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [enrichStatus, setEnrichStatus] = useState("");
  const [enrichErrors, setEnrichErrors] = useState<string[]>([]);
  const [estimates, setEstimates] = useState<Array<{ market: string; price: number; currency: string; unit_price: number | null; unit_basis: string | null }>>([]);
  // Manuelle Richtpreise je Markt (ohne KI, keine Credits).
  const [mkts, setMkts] = useState<{ code: string; name: string; flag: string; currency: string }[]>([]);
  const [mp, setMp] = useState<Record<string, string>>({});
  const [mpOrig, setMpOrig] = useState<Record<string, string>>({});
  const [mpOpen, setMpOpen] = useState(Boolean(p.openPrices));
  const priceRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (p.openPrices) priceRef.current?.scrollIntoView({ block: "start" });
  }, [p.openPrices]);
  useEffect(() => {
    if (isDept) return;
    let off = false;
    void (async () => {
      const [m, pr] = await Promise.all([
        supabase.from("markets").select("code, name, flag, currency").eq("enabled", true).order("sort_order"),
        prod ? supabase.from("product_reference_prices").select("market, price").eq("product_id", prod.id) : Promise.resolve({ data: [] as { market: string; price: number }[] }),
      ]);
      if (off) return;
      setMkts(m.data ?? []);
      const o: Record<string, string> = {};
      for (const r of pr.data ?? []) o[r.market] = String(r.price);
      setMpOrig(o); setMp(o);
      const cur = o[currentMarket()];
      if (cur) setPrice((x) => x || cur);
    })();
    return () => { off = true; };
  }, [isDept, prod?.id]);
  const [variants, setVariants] = useState<string[]>(prod?.variants ?? []);
  const [prefixVariants, setPrefixVariants] = useState<string[]>(prod?.prefix_variants ?? []);
  const commonVariants = useStandardVariants();
  const [variantInput, setVariantInput] = useState("");
  const [vDrag, setVDrag] = useState<number | null>(null);
  const [vOver, setVOver] = useState<number | null>(null);
  const [prodLines, setProdLines] = useState("");
  const heads = p.headings ?? [];
  const curHeadingId = (() => {
    if (!prod) return "";
    const idx = p.products.findIndex((x) => x.id === prod.id);
    let curH = "";
    for (const h of heads) { const ai = p.products.findIndex((x) => x.id === h.before_product_id); if (ai >= 0 && ai <= idx) curH = h.id; }
    return curH;
  })();
  const [headingSel, setHeadingSel] = useState(curHeadingId);
  const addVariant = (v: string) => {
    const vals = v.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    setVariants((x) => {
      const next = [...x];
      for (const val of vals) if (!next.some((y) => y.toLowerCase() === val.toLowerCase())) next.push(val);
      return next;
    });
    setVariantInput("");
  };
  const effId = item?.id ?? newId ?? undefined;
  // Reload whenever the preview changes so "icon like preview" always uses the current image.
  useEffect(() => { if (effId) void loadIcon(effId); }, [effId, imagePreview]);
  useEffect(() => {
    if (!p.imageOnly || !p.imageEditorProduct?.image_path) return;
    let alive = true;
    void supabase.storage.from("catalog-images").createSignedUrl(p.imageEditorProduct.image_path, 600).then(({ data }) => {
      if (alive && data?.signedUrl) setImagePreview(data.signedUrl);
    });
    return () => { alive = false; };
  }, [p.imageOnly, p.imageEditorProduct?.image_path]);
  const table = isDept ? "departments" : "products";

  // KI-Vorschlag für den Bildtext einer Kategorie, abgeleitet aus den enthaltenen Produkten.
  const [suggesting, setSuggesting] = useState(false);
  // Produkte, die für den Bildvorschlag per Checkbox gewählt werden können.
  const [pickList, setPickList] = useState<{ id: string; name: string; emoji: string | null }[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [pickSearch, setPickSearch] = useState("");
  useEffect(() => {
    if (!isDept || !effId) { setPickList([]); return; }
    let off = false;
    void (async () => {
      const [own, al] = await Promise.all([
        supabase.from("products").select("id, name, emoji").eq("department_id", effId).order("sort_order").limit(200),
        supabase.from("product_aliases").select("products(id, name, emoji)").eq("department_id", effId).order("sort_order").limit(100),
      ]);
      let list = [...(own.data ?? []), ...((al.data ?? []).map((r) => (r as { products: { id: string; name: string; emoji: string | null } | null }).products).filter(Boolean) as { id: string; name: string; emoji: string | null }[])];
      if (!list.length) {
        const { data: kids } = await supabase.from("departments").select("id").eq("parent_id", effId);
        const ids = (kids ?? []).map((k) => k.id);
        if (ids.length) list = (await supabase.from("products").select("id, name, emoji").in("department_id", ids).order("sort_order").limit(200)).data ?? [];
      }
      const seen = new Set<string>();
      list = list.filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)));
      if (off) return;
      setPickList(list);
      setPicked(new Set(list.slice(0, 30).map((x) => x.id)));
    })();
    return () => { off = true; };
  }, [effId, isDept]);
  const loadSuggestion = (overwrite: boolean, ids?: string[]) => {
    if (!isDept || !effId) return;
    setSuggesting(true);
    void suggestPrompt({ data: { departmentId: effId, ...(ids?.length ? { productIds: ids.slice(0, 60) } : {}) } })
      .then((r) => { if (r.prompt) setHint((h) => (overwrite || !h.trim() ? r.prompt : h)); })
      .catch(() => {})
      .finally(() => setSuggesting(false));
  };
  // Kein automatischer KI-Aufruf beim Öffnen (spart Credits) — Vorschlag nur per ↻-Knopf.

  const save = async () => {
    if (enriching) return;
    const isNewProduct = !item && !isDept && !newId;
    let createdId: string | undefined;
    await p.run(async () => {
    if (!name.trim()) throw new Error(T("tile.nameRequired"));
    const base = { name: name.trim(), emoji: emoji.trim() || null };
    let id = item?.id;
    if (item) {
      await p.must(isDept
        ? supabase.from("departments").update(base).eq("id", item.id)
        : supabase.from("products").update({ ...base, default_quantity: qty, default_unit: unit as never, allowed_units: allowedUnits.filter((u) => u !== unit), unit_quantities: unitQuantities, variants, prefix_variants: prefixVariants.filter((x) => variants.includes(x)) } as never).eq("id", item.id));
      if (item.name !== base.name) {
        await p.must(supabase.from("catalog_translations").delete().eq("entity_id", item.id).eq("is_manual", false));
        await p.translateIds([item.id]);
      }
      if (!isDept) void trVariants({ data: { productId: item.id } }).catch(() => {});
      if (!isDept && prod && newDept && newDept !== (prod.alias_id ? p.cur : prod.department_id)) p.onMoveSelected?.([prod.alias_id ? `alias:${prod.alias_id}` : item.id], newDept);
    } else {
      const r = isDept
        ? await supabase.from("departments").insert({ ...base, parent_id: p.cur, sort_order: p.children.length + 1 }).select("id").single()
        : await (async () => {
            const targetDept = newDept || p.cur!;
            // Fremde Kategorie: ans Ende dieser Kategorie (höchster sort_order + 1)
            const nextSort = targetDept === p.cur
              ? p.products.length + 1
              : await supabase.from("products").select("sort_order").eq("department_id", targetDept).order("sort_order", { ascending: false }).limit(1)
                  .then(({ data }) => ((data?.[0] as { sort_order: number } | undefined)?.sort_order ?? 0) + 1);
            return supabase.from("products").insert({ ...base, department_id: targetDept, default_quantity: qty, default_unit: unit as never, allowed_units: allowedUnits.filter((u) => u !== unit), unit_quantities: unitQuantities, variants, sort_order: nextSort } as never).select("id").single();
          })();
      if (r.error) throw new Error(r.error.message);
      id = r.data.id;
      if (!isNewProduct && !isDept) await p.translateIds([id]);
      if (!isDept) void trVariants({ data: { productId: id } }).catch(() => {});
      setNewId(id);
      if (isNewProduct) createdId = id;
      if (isDept && id) {
        const deptId = id;
        const trIds = [deptId];
        const names = [...new Set(prodLines.split(/\r?\n/).map((l) => l.trim()).filter(Boolean))];
        if (names.length) {
          const rows = names.map((n, i) => ({ department_id: deptId, name: n, default_quantity: 1, default_unit: "stueck" as never, sort_order: i + 1 }));
          const ins = await supabase.from("products").insert(rows).select("id");
          if (ins.error) throw new Error(ins.error.message);
          trIds.push(...(ins.data ?? []).map((x) => x.id as string));
        }
        // Übersetzung erst nach dem Anlegen der Produkte und ohne zu blockieren
        void p.translateIds(trIds).catch(() => {});
      }
    }
    if (!isDept && id) {
      const cm = currentMarket();
      const vals: Record<string, string> = { ...mp, ...(price.trim() || mpOrig[cm] ? { [cm]: price } : {}) };
      let changed = false;
      for (const [market, raw] of Object.entries(vals)) {
        const v = raw.trim().replace(",", ".");
        if (v === (mpOrig[market] ?? "")) continue;
        changed = true;
        if (!v) {
          await p.must(supabase.from("product_reference_prices").delete().eq("product_id", id).eq("market", market));
        } else if (!Number.isNaN(Number(v))) {
          const ccy = mkts.find((m) => m.code === market)?.currency ?? MARKET_CCY[market] ?? "EUR";
          await p.must(supabase.from("product_reference_prices").upsert({ product_id: id, market, price: Number(v), currency: ccy, observed_at: new Date().toISOString() }, { onConflict: "product_id,market" }));
        }
      }
      if (changed) void qc.invalidateQueries();
    }
    // Neue Produkte bleiben offen für die automatische Ergänzung (Übersetzungen, Preise); sonst schliessen.
    if (!isNewProduct) p.onClose();
    });
    if (createdId) {
      const id = createdId;
      const errors: string[] = [];
      setEnriching(true);
      setEnrichErrors([]);
      const step = async (label: string, fn: () => Promise<void>) => {
        setEnrichStatus(label);
        try { await fn(); } catch (e) { errors.push(`${label}: ${e instanceof Error ? e.message : String(e)}`); setEnrichErrors([...errors]); }
      };
      await step(T("tile.enrichTranslation"), async () => { await p.translateIds([id]); });
      // Kein automatisches KI-Bild mehr: Bilder gibt es nur noch auf ausdrücklichen Knopfdruck.

      await step(T("tile.enrichPrices"), async () => {
        const r = await estAll({ data: { productId: id, skipExisting: true } });
        setEstimates(r.items);
        const mine = r.items.find((x) => x.market === currentMarket());
        if (mine && !price.trim()) setPrice(String(mine.price));
        if (r.failed) throw new Error(T("tile.estimateAllFailed", { n: r.failed }));
      });
      void qc.invalidateQueries();
      setEnrichStatus(errors.length ? T("tile.enrichPartial") : T("tile.enrichDone"));
      setEnriching(false);
    }
    if (!isDept && item && headingSel !== curHeadingId) p.onAssignHeading?.(item.id, headingSel);
  };

  /** Fragt nach, ob ein vorhandenes kleines Icon durch das neue Vorschaubild ersetzt werden soll. */
  const askReplaceIcon = async (id: string): Promise<boolean> => {
    const { data } = await supabase.from(isDept ? "departments" : "products").select("icon_path").eq("id", id).single();
    const has = Boolean((data as { icon_path: string | null } | null)?.icon_path);
    if (!has) return !isDept;
    return window.confirm(T("tile.replaceIconConfirm"));
  };
  const applyPreview = async (id: string, path: string, replace: boolean, blob?: Blob) => {
    const kind = isDept ? "department" : "product";
    if (!replace) { await setPreviewImageOnly(kind, id, path); return; }
    if (isDept) { await setPreviewImageOnly(kind, id, path); await saveCustomIconFromPath(kind, id, path); }
    else if (blob) await saveProductIcon(id, blob, path, true);
    else { await setPreviewImageOnly(kind, id, path); const r = await supabase.storage.from("catalog-images").createSignedUrl(path, 600); if (r.data?.signedUrl) await saveProductIcon(id, await (await fetch(r.data.signedUrl)).blob(), path, true); }
    await forgetCatalogImage(path);
    await loadIcon(id);
  };

  const upload = (file: File) => p.run(async () => {
    const blob = await prepareCategoryImage(file);
    if (!effId) throw new Error(T("tile.nameRequired"));
    const path = `${table}/${effId}-${crypto.randomUUID()}.webp`;
    const replace = await askReplaceIcon(effId);
    const { error } = await supabase.storage.from("catalog-images").upload(path, blob, { contentType: "image/webp", upsert: true });
    if (error) throw new Error(error.message);
    await applyPreview(effId, path, replace, blob);
    const { data: signed } = await supabase.storage.from("catalog-images").createSignedUrl(path, 600);
    setImagePreview(signed?.signedUrl ?? null);
  });

  const removeImage = async () => {
    if (!effId || !window.confirm(T("tile.removeImageConfirm"))) return;
    setImageBusy(true);
    try {
      await p.run(async () => {
        if (isDept) await p.must(supabase.from(table).update({ image_path: null }).eq("id", effId));
        else await p.must(supabase.from("products").update({ image_path: null, icon_path: null }).eq("id", effId));
        if (item && "image_path" in item && item.image_path) await forgetCatalogImage(item.image_path);
        setImagePreview(null);
        setLarge(null);
        await qc.invalidateQueries({ queryKey: ["admin-tile-imgs"] });
        await qc.invalidateQueries({ queryKey: ["catalog"] });
      }, T("tile.imageRemoved"));
    } finally { setImageBusy(false); }
  };

  const generateDialogImage = async () => {
    if (!effId) return;
    setImageBusy(true);
    try {
      await p.run(async () => {
        const generated = await genImg({ data: { id: effId, kind: isDept ? "department" : "product", hint: hint.trim() || undefined, opts: imgOpts } });
        await forgetCatalogImage(generated.path);
        await applyPreview(effId, generated.path, false);
        const { data, error } = await supabase.storage.from("catalog-images").createSignedUrl(generated.path, 600);
        if (error) throw error;
        if (data?.signedUrl) setImagePreview(data.signedUrl);
      }, T("tile.imgDone"));
    } finally { setImageBusy(false); }
  };

  /** Übernimmt das grosse Vorschaubild als eigenes Icon („Beide Bilder gleich"). */
  const useImageAsIcon = async () => {
    if (!effId) return;
    await p.run(async () => {
      const { data } = await supabase.from(isDept ? "departments" : "products").select("image_path").eq("id", effId).single();
      const current = (data as { image_path: string | null } | null)?.image_path;
      if (!current) throw new Error(T("tile.noImage"));
      await saveCustomIconFromPath(isDept ? "department" : "product", effId, current);
      await loadIcon(effId);
      await qc.invalidateQueries({ queryKey: ["catalog"] });
    }, T("adm.iconUseImageDone"));
  };
  const pickIcon = (path: string) => {
    setIconPicking(false);
    void p.run(async () => {
      await saveCustomIconFromPath(isDept ? "department" : "product", effId!, path);
      await loadIcon(effId!);
      await qc.invalidateQueries({ queryKey: ["catalog"] });
    });
  };
  /** Erzeugt ein KI-Bild für das Icon (mit Credits-Bestätigung). */
  const aiIcon = async () => {
    if (!effId) return;
    if (!window.confirm(T("adm.variantImageAiConfirm", { name: name.trim() || T("adm.iconImage") }))) return;
    setImageBusy(true);
    try {
      await p.run(async () => {
        const generated = await genImg({ data: { id: effId, kind: isDept ? "department" : "product", iconOnly: true, hint: iconHint.trim() || undefined, opts: iconImgOpts } });
        await forgetCatalogImage(generated.path);
        await saveCustomIconFromPath(isDept ? "department" : "product", effId, generated.path);
        await loadIcon(effId);
        await qc.invalidateQueries({ queryKey: ["catalog"] });
      }, T("tile.imgDone"));
    } finally { setImageBusy(false); }
  };

  return (
    <div className={`fixed inset-0 ${p.imageOnly ? "z-[70]" : "z-40"} flex items-end justify-center bg-foreground/30`} onClick={p.onClose}>
      <div role="dialog" aria-modal="true" aria-label={p.imageOnly ? T("adm.previewImage") : T("tile.editItem")} className="max-h-[calc(100dvh-1rem)] w-full max-w-[440px] overflow-x-hidden overflow-y-auto overscroll-contain rounded-t-3xl bg-background p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:max-h-[90dvh] sm:p-5" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-3">
        {picking && effId && <ImagePicker onClose={() => setPicking(false)} onPick={(path) => { setPicking(false); void p.run(async () => {
          await applyPreview(effId, path, await askReplaceIcon(effId));
          const { data: signed } = await supabase.storage.from("catalog-images").createSignedUrl(path, 600);
          setImagePreview(signed?.signedUrl ?? null);
        }); }} />}
        {iconPicking && effId && <ImagePicker onClose={() => setIconPicking(false)} onPick={(path) => pickIcon(path)} />}
        <div className="flex items-center justify-between gap-2"><h2 className="text-lg font-bold text-foreground">{p.imageOnly ? T("adm.previewImage") : item ? T("tile.editItem") : isDept ? T("tile.newCat") : T("tile.newProd")}</h2><Button type="button" variant="ghost" size="icon" aria-label={T("adm.close")} onClick={p.onClose}>✕</Button></div>
        {enrichStatus && <div role="status" className="text-sm text-foreground">{enriching && <span aria-hidden="true">⏳ </span>}{enrichStatus}</div>}
        {enrichErrors.length > 0 && <ul className="max-h-24 overflow-auto text-xs text-destructive">{enrichErrors.map((error) => <li key={error}>{error}</li>)}</ul>}
        {!p.imageOnly && <div className="flex gap-2">
          <Input aria-label={T("tile.emoji")} placeholder="🙂" value={emoji} onChange={(e) => setEmoji(e.target.value)} className="h-11 w-16 rounded-xl text-center text-xl" />
          <Input aria-label={T("tile.name")} placeholder={T("tile.name")} value={name} onChange={(e) => setName(e.target.value)} className="h-11 flex-1 rounded-xl" />
        </div>}
        {!p.imageOnly && (
          <Button className="h-11 w-full rounded-xl" disabled={enriching || (!isDept && Object.values(unitQuantities).some((n) => !Number.isFinite(n) || n <= 0))} onClick={() => void save()}>{enriching ? T("adm.working") : T("tile.save")}</Button>
        )}
        {effId && (
          <PreviewCollapse label={T("adm.previewImage")} src={(imagePreview === undefined ? p.imgUrl : imagePreview) ?? null} emoji={emoji || (isDept ? "📁" : "🛒")} defaultOpen={Boolean(p.imageOnly)}>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>{T("tile.upload")}</Button>
              <Button size="sm" variant="outline" onClick={() => setPicking(true)}>🖼️ {T("tile.pickImage")}</Button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
            </div>
            <details className="rounded-xl border border-border p-2">
              <summary className="cursor-pointer select-none text-sm font-medium text-foreground">✨ {T("tile.aiOptions")}</summary>
              <div className="mt-2 space-y-2">
                <div className="flex gap-2">
                  <Input aria-label={T("tile.aiHint")} placeholder={suggesting ? T("tile.aiSuggestLoading") : isDept ? T("tile.aiHintEmpty") : T("tile.aiHint")} value={hint} onChange={(e) => setHint(e.target.value)} className="h-10 flex-1 rounded-xl text-sm" />
                  {isDept && (
                    <Button size="sm" variant="outline" className="h-10 px-3" disabled={suggesting} aria-label={T("tile.aiSuggestReload")} title={T("tile.aiSuggestReload")} onClick={() => loadSuggestion(true, [...picked])}>↻</Button>
                  )}
                </div>
                <AiImageOptionSelects value={imgOpts} onChange={setImgOpts} />
              </div>
            </details>
            {isDept && pickList.length > 0 && (
              <details className="rounded-xl border border-border p-2 text-sm">
                <summary className="cursor-pointer select-none font-medium text-foreground">
                  {T("tile.imgProducts")} · {T("tile.imgProductsCount", { n: picked.size })}
                </summary>
                <div className="mt-2 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setPicked(new Set(pickList.map((x) => x.id)))}>{T("tile.imgProductsAll")}</Button>
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setPicked(new Set())}>{T("tile.imgProductsNone")}</Button>
                    {pickList.length > 12 && <Input value={pickSearch} onChange={(e) => setPickSearch(e.target.value)} placeholder={T("tile.deptAliasSearch")} className="h-7 flex-1 text-xs" />}
                  </div>
                  <div className="max-h-48 space-y-1 overflow-y-auto">
                    {pickList.filter((x) => !pickSearch.trim() || x.name.toLowerCase().includes(pickSearch.trim().toLowerCase())).map((x) => (
                      <label key={x.id} className="flex items-center gap-2 text-xs text-foreground">
                        <input type="checkbox" checked={picked.has(x.id)} onChange={(e) => setPicked((s) => { const n = new Set(s); if (e.target.checked) n.add(x.id); else n.delete(x.id); return n; })} />
                        <span>{x.emoji ?? ""} {x.name}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{T("tile.imgProductsHint")}</p>
                </div>
              </details>
            )}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={imageBusy || p.busy} onClick={() => void generateDialogImage()}>{imageBusy ? T("adm.working") : isDept || !item ? `✨ ${T("tile.aiImage")}` : `✨ ${T("tile.regenerateImage")}`}</Button>
              {(imagePreview === undefined ? Boolean(p.imgUrl) : Boolean(imagePreview)) && item &&
                <Button size="sm" variant="outline" className="text-destructive" disabled={imageBusy || p.busy} onClick={() => void removeImage()}>{T("tile.removeImage")}</Button>}
            </div>
          </PreviewCollapse>
        )}
        {effId && (
          <IconCollapse label={T("adm.iconImage")} hint={iconInfo.custom ? undefined : T("adm.iconAutoHint")} src={iconInfo.url} emoji={emoji || (isDept ? "📁" : "🛒")}>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => iconFileRef.current?.click()}>{T("tile.upload")}</Button>
              {iconInfo.custom && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (window.confirm(T("tile.removeImageConfirm"))) void p.run(async () => { await clearCustomIcon(isDept ? "department" : "product", effId); await loadIcon(effId); await qc.invalidateQueries({ queryKey: ["catalog"] }); }); }}>{T("tile.removeImage")}</Button>}
              <input ref={iconFileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void p.run(async () => { await saveCustomIcon(isDept ? "department" : "product", effId, f); await loadIcon(effId); await qc.invalidateQueries({ queryKey: ["catalog"] }); }); }} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={p.busy || !imgPath} onClick={() => void useImageAsIcon()}>{T("adm.iconUseImage")}</Button>
              <Button size="sm" variant="outline" disabled={p.busy} onClick={() => setIconPicking(true)}>🖼️ {T("adm.iconPick")}</Button>
              <Button size="sm" variant="outline" disabled={imageBusy || p.busy} onClick={() => void aiIcon()}>{imageBusy ? T("adm.working") : `✨ ${T("adm.iconAi")}`}</Button>
            </div>
            <details className="rounded-xl border border-border p-2">
              <summary className="cursor-pointer select-none text-sm font-medium text-foreground">✨ {T("tile.aiOptions")}</summary>
              <div className="mt-2 space-y-2">
                <Input aria-label={`${T("adm.iconImage")} · ${T("tile.aiHint")}`} placeholder={T("tile.aiHint")} value={iconHint} onChange={(e) => setIconHint(e.target.value)} className="h-10 w-full rounded-xl text-sm" />
                <AiImageOptionSelects value={iconImgOpts} onChange={setIconImgOpts} />
              </div>
            </details>
          </IconCollapse>
        )}
        {!p.imageOnly && !isDept && (
          <label className="flex items-center gap-2 text-sm">
            <span className="shrink-0 text-muted-foreground">{T("adm.category")}</span>
            <select aria-label={T("adm.category")} value={newDept || (prod?.alias_id ? p.cur : prod?.department_id) || p.cur || ""} onChange={(e) => setNewDept(e.target.value)} className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-background px-2 text-sm">
              {newDeptOpts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </label>
        )}
        {!p.imageOnly && isDept && !item && (
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">{T("tile.deptProducts")}</h3>
            <textarea
              rows={5}
              value={prodLines}
              onChange={(e) => setProdLines(e.target.value)}
              placeholder={T("tile.deptProductsPlaceholder")}
              className="min-h-[96px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            {prodLines.trim() && <p className="text-[11px] text-muted-foreground">{T("adm.detected", { n: new Set(prodLines.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)).size })}</p>}
          </div>
        )}
        {!p.imageOnly && !isDept && <AllowedUnitsPicker value={{ primary: unit, units: allowedUnits, quantities: unitQuantities }} onChange={(next) => { setUnit(next.primary); setAllowedUnits(next.units); setUnitQuantities(next.quantities); setQty(next.quantities[next.primary] ?? 1); }} />}
        {!p.imageOnly && !isDept && item && heads.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-foreground">{T("adm.headingAssign")}</h3>
            <select aria-label={T("adm.headingAssign")} value={headingSel} onChange={(e) => setHeadingSel(e.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-2 text-sm">
              <option value="">{T("adm.noHeading")}</option>
              {heads.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
        )}
        {!p.imageOnly && !isDept && (
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground">{T("adm.variants")}</h3>
              {prod && <VariantAiBulkButton productId={prod.id} productName={prod.name} variants={prod.variants ?? []} />}
            </div>
            {variants.length > 0 && (
              <div className="divide-y divide-border rounded-lg border border-border">
                {variants.map((v, vi) => (
                  <div
                    key={v}
                    draggable
                    onDragStart={() => setVDrag(vi)}
                    onDragOver={(e) => { e.preventDefault(); setVOver(vi); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (vDrag === null || vDrag === vi) { setVDrag(null); setVOver(null); return; }
                      setVariants((x) => { const next = [...x]; const moved = next[vDrag]!; next.splice(vDrag, 1); next.splice(vi, 0, moved); return next; });
                      setVDrag(null); setVOver(null);
                    }}
                    onDragEnd={() => { setVDrag(null); setVOver(null); }}
                    className={`flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 text-sm ${vDrag === vi ? "opacity-40" : ""} ${vOver === vi && vDrag !== null && vDrag !== vi ? "bg-primary-soft" : ""}`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span aria-hidden className="cursor-grab select-none text-muted-foreground">⠿</span>
                      <VariantNameEdit productId={prod?.id} variant={v} saved={(prod?.variants ?? []).includes(v)} existing={variants} onRenamed={(n) => setVariants((x) => x.map((y) => (y === v ? n : y)))} />
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPrefixVariants((x) => (x.includes(v) ? x.filter((y) => y !== v) : [...x, v]))}
                        aria-pressed={prefixVariants.includes(v)}
                        title={T("adm.variantPosHint")}
                        className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${prefixVariants.includes(v) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                      >
                        {prefixVariants.includes(v) ? `${v} ${name || prod?.name || ""}` : `${name || prod?.name || ""} ${v}`}
                      </button>
                      {prod && (prod.variants ?? []).includes(v) && <VariantImageButton productId={prod.id} productName={prod.name} variant={v} />}
                      <button type="button" aria-label={`${v} entfernen`} onClick={() => setVariants((x) => x.filter((y) => y !== v))} className="shrink-0 text-muted-foreground hover:text-destructive">✕</button>
                    </span>
                    {prod && (prod.variants ?? []).includes(v) && <VariantSynonyms productId={prod.id} variant={v} />}
                    {prod && (prod.variants ?? []).includes(v) && <VariantTranslations productId={prod.id} variant={v} />}
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-start gap-2">
              <textarea
                value={variantInput}
                rows={3}
                placeholder={T("adm.variantPlaceholder")}
                onChange={(e) => setVariantInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); addVariant(variantInput); } }}
                className="min-h-[72px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <Button type="button" variant="outline" onClick={() => addVariant(variantInput)} disabled={!variantInput.trim()}>+</Button>
            </div>
            <VariantAiSuggest name={prod?.name ?? ""} variants={variants} onAdd={(vs) => setVariants((x) => [...x, ...vs.filter((v) => !x.some((y) => y.toLowerCase() === v.toLowerCase()))])} />
            <div className="flex flex-wrap gap-1.5">
              {commonVariants.map((cv) => {
                const on = variants.some((x) => x.toLowerCase() === cv.value.toLowerCase());
                return (
                  <button key={cv.value} type="button" disabled={on} onClick={() => addVariant(cv.value)}
                    className={`rounded-full border px-2.5 py-1 text-xs ${on ? "border-primary bg-primary/15 text-muted-foreground line-through" : "border-border bg-background text-muted-foreground"}`}>
                    {on ? "✓ " : "+ "}{cv.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">{T("adm.variantsHint")}</p>
          </div>
        )}
        {!p.imageOnly && !isDept && item && <ProductPronunciationEditor name={item.name} />}
        {!p.imageOnly && item && effId && (
          <SheetTranslations kind={isDept ? "department" : "product"} id={isDept ? effId : (prod?.product_id ?? effId)} baseName={item.name} />
        )}
        {!p.imageOnly && !isDept && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">{T("tile.priceEstimate")}</h3>
            <div className="flex gap-2">
              <Input aria-label={T("tile.price")} placeholder={T("tile.price", { market: currentMarket() })} type="number" min={0} step="any" value={price} onChange={(e) => setPrice(e.target.value)} className="h-11 flex-1 rounded-xl" />
              {item && (
                <Button variant="outline" className="h-11 rounded-xl" disabled={estimating} onClick={() => {
                  if (!window.confirm(T("tile.estimateAllConfirm"))) return;
                  setEstimating(true);
                  void p.run(async () => {
                    const r = await estAll({ data: { productId: item.id } });
                    setEstimates(r.items);
                    const mine = r.items.find((x) => x.market === currentMarket());
                    if (mine) setPrice(String(mine.price));
                    const est: Record<string, string> = {};
                    for (const x of r.items) est[x.market] = String(x.price);
                    setMp((o) => ({ ...o, ...est }));
                    setMpOrig((o) => ({ ...o, ...est }));
                    void qc.invalidateQueries();
                    if (r.failed > 0) throw new Error(T("tile.estimateAllFailed", { n: r.failed }));
                  }, T("tile.estimateAllDone")).finally(() => setEstimating(false));
                }}>{estimating ? "…" : `✨ ${T("tile.estimateAll")}`}</Button>
              )}
            </div>
            {mkts.length > 0 && (
              <div ref={priceRef} className="rounded-xl border border-border">
                <button type="button" onClick={() => setMpOpen((v) => !v)} className="flex w-full items-center justify-between px-3 py-2 text-sm font-semibold text-foreground">
                  <span>{T("tile.marketPrices")} ({Object.values({ ...mp, [currentMarket()]: price }).filter((v) => v.trim()).length}/{mkts.length})</span>
                  <span className="text-muted-foreground">{mpOpen ? "▾" : "▸"}</span>
                </button>
                {mpOpen && (
                  <div className="space-y-1.5 border-t border-border p-2">
                    <p className="text-xs text-muted-foreground">{T("tile.marketPricesHint")}</p>
                    {mkts.map((m) => {
                      const isCur = m.code === currentMarket();
                      const v = isCur ? price : (mp[m.code] ?? "");
                      return (
                        <div key={m.code} className="flex items-center gap-2 text-sm">
                          <span className="w-6 text-center">{m.flag}</span>
                          <span className="flex-1 truncate text-foreground">{m.name}</span>
                          <span className="w-10 text-xs text-muted-foreground">{m.currency}</span>
                          <Input aria-label={`${m.name} ${m.currency}`} type="number" min={0} step="any" value={v} onChange={(e) => (isCur ? setPrice(e.target.value) : setMp((o) => ({ ...o, [m.code]: e.target.value })))} className="h-9 w-28 rounded-lg" />
                          {item && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              aria-label={T("tile.estimateMarket", { market: m.name })}
                              title={T("tile.estimateMarket", { market: m.name })}
                              disabled={estOne === m.code}
                              onClick={() => {
                                setEstOne(m.code);
                                void p.run(async () => {
                                  const r = await estOneFn({ data: { productId: item.id, market: m.code } });
                                  if (isCur) setPrice(String(r.price));
                                  else setMp((o) => ({ ...o, [m.code]: String(r.price) }));
                                }, T("tile.estimateDone")).finally(() => setEstOne(null));
                              }}
                              className="h-9 w-9 shrink-0 rounded-lg px-0"
                            >
                              {estOne === m.code ? "…" : "✨"}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {!p.imageOnly && <div className="flex flex-wrap gap-2 pt-1">
          {item && p.onAdvanced && <Button variant="outline" className="h-11 rounded-xl" onClick={() => { p.onAdvanced!(p.target.kind, item.id); p.onClose(); }}>⚙ {T("tile.advanced")}</Button>}
          {item && <Button variant="outline" className="h-11 rounded-xl text-destructive" onClick={() => { const aid = (item as { alias_id?: string }).alias_id; if (aid && !isDept) p.onRemoveAlias?.(aid, item.name); else p.remove(p.target.kind, item.id, item.name); p.onClose(); }}>{T("tile.delete")}</Button>}
          <Button variant="outline" className="h-11 rounded-xl" onClick={p.onClose}>{T("common.cancel")}</Button>
          <Button className="h-11 flex-1 rounded-xl" disabled={enriching || (!isDept && Object.values(unitQuantities).some((n) => !Number.isFinite(n) || n <= 0))} onClick={() => void save()}>{enriching ? T("adm.working") : T("tile.save")}</Button>
        </div>}
        </div>
      </div>
      {large && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 p-6" onClick={() => setLarge(null)}>
          <button type="button" aria-label={T("common.cancel")} onClick={() => setLarge(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-xl text-foreground shadow">✕</button>
          <img src={large} alt="" className="max-h-[85vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl" />
        </div>
      )}
    </div>
  );
}

function ImagePicker(p: { onClose: () => void; onPick: (path: string) => void }) {
  const list = useServerFn(listProductImages);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const r = useQuery({ queryKey: ["admin-image-picker", q, page], queryFn: () => list({ data: { q, page, perPage: 30 } }) });
  const pages = r.data ? Math.max(1, Math.ceil(r.data.total / r.data.perPage)) : 1;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40" onClick={(e) => { e.stopPropagation(); p.onClose(); }}>
      <div className="flex max-h-[85vh] w-full max-w-[440px] flex-col gap-3 rounded-t-3xl bg-background p-5 pb-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">{T("tile.pickImage")}</h2>
          <button aria-label={T("common.cancel")} onClick={p.onClose} className="text-xl text-muted-foreground">✕</button>
        </div>
        <Input placeholder="🔍" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} className="h-11 rounded-xl" />
        <div className="grid flex-1 grid-cols-3 gap-2 md:grid-cols-6 overflow-y-auto">
          {r.data?.items.map((it) => (
            <button key={it.id} onClick={() => p.onPick(it.path)} className="flex flex-col items-center gap-1 rounded-xl p-1 hover:bg-muted">
              {it.url ? <img src={it.url} alt="" className="aspect-square w-full rounded-lg object-cover" /> : <div className="aspect-square w-full rounded-lg bg-muted" />}
              <span className="line-clamp-2 text-center text-[11px] text-foreground">{it.name}</span>
            </button>
          ))}
          {r.data && r.data.items.length === 0 && <p className="col-span-3 py-6 text-center text-sm text-muted-foreground">{T("tile.pickEmpty")}</p>}
          {r.isLoading && <p className="col-span-3 py-6 text-center text-sm text-muted-foreground">…</p>}
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>‹</Button>
            <span className="text-sm text-muted-foreground">{page + 1} / {pages}</span>
            <Button size="sm" variant="outline" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>›</Button>
          </div>
        )}
      </div>
    </div>
  );
}

type Suggestion = { name: string; emoji: string; quantity: number; unit: string; existingId: string | null; relevance: number };

function SuggestSheet(p: Parameters<typeof CatalogTileEditor>[0] & { cur: string; onClose: () => void }) {
  const suggest = useServerFn(suggestCategoryProducts);
  const [keywords, setKeywords] = useState("");
  const [items, setItems] = useState<Suggestion[] | null>(null);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"relevance" | "alpha" | "loaded">("relevance");

  const load = async (more: boolean) => {
    setBusy(true); setErr(null);
    try {
      const prev = more ? items ?? [] : [];
      const r = await suggest({ data: { departmentId: p.cur, keywords: keywords.trim() || undefined, count: 10, exclude: prev.map((x) => x.name).slice(0, 300) } });
      const have = new Set(prev.map((x) => x.name.toLowerCase()));
      const fresh = r.filter((x) => !have.has(x.name.toLowerCase()));
      setItems([...prev, ...fresh]);
      setSel((o) => { const n = new Set(more ? o : []); fresh.forEach((x) => n.add(x.name)); return n; });
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  const shown = (() => {
    const l = [...(items ?? [])];
    if (sortBy === "relevance") l.sort((a, b) => b.relevance - a.relevance);
    else if (sortBy === "alpha") l.sort((a, b) => a.name.localeCompare(b.name));
    return l;
  })();
  const stars = (r: number) => (r >= 70 ? "★★★" : r >= 40 ? "★★" : "★");
  const chosen = (items ?? []).filter((x) => sel.has(x.name));

  const create = () => p.run(async () => {
    const fresh = chosen.filter((s) => !s.existingId);
    const links = chosen.filter((s) => s.existingId);
    const ids: string[] = [];
    if (fresh.length) {
      const r = await supabase.from("products").insert(fresh.map((s, i) => ({
        name: s.name, emoji: s.emoji, department_id: p.cur, default_quantity: s.quantity, default_unit: s.unit as never, sort_order: p.products.length + i + 1,
      }))).select("id");
      if (r.error) throw new Error(r.error.message);
      ids.push(...r.data.map((x) => x.id));
    }
    if (links.length) {
      await p.must(supabase.from("product_aliases").upsert(links.map((s) => ({ product_id: s.existingId!, department_id: p.cur })), { onConflict: "product_id,department_id", ignoreDuplicates: true }));
    }
    for (let i = 0; i < ids.length; i += 120) await p.translateIds(ids.slice(i, i + 120));
    p.onClose();
  }, T("tile.suggestDone", { n: chosen.length }));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40" onClick={p.onClose}>
      <div className="max-h-[85vh] w-full max-w-[440px] space-y-3 overflow-y-auto rounded-t-2xl bg-background p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{T("tile.suggest")}</h2>
          <button type="button" onClick={p.onClose} className="text-xl">✕</button>
        </div>
        <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder={T("tile.suggestKeywords")} />
        <Button className="w-full" variant={items ? "outline" : "default"} disabled={busy} onClick={() => void load(false)}>
          {busy ? T("tile.suggestBusy") : items ? T("tile.suggestAgain") : T("tile.suggestGo")}
        </Button>
        {err && <p className="text-sm text-destructive">{err}</p>}
        {items && items.length === 0 && <p className="text-sm text-muted-foreground">{T("tile.suggestEmpty")}</p>}
        {items && items.length > 0 && (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            {T("tile.suggestSort")}
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="h-9 flex-1 rounded-lg border border-input bg-background px-2 text-foreground">
              <option value="relevance">{T("tile.sortRelevance")}</option>
              <option value="alpha">{T("tile.sortAlpha")}</option>
              <option value="loaded">{T("tile.sortLoaded")}</option>
            </select>
          </label>
        )}
        {items && items.length > 0 && (
          <div className="divide-y divide-border rounded-xl border border-border">
            {shown.map((s) => (
              <label key={s.name} className="flex items-center gap-3 px-3 py-2 text-sm">
                <input type="checkbox" checked={sel.has(s.name)} onChange={() => setSel((o) => { const n = new Set(o); if (n.has(s.name)) n.delete(s.name); else n.add(s.name); return n; })} />
                <span className="text-xl">{s.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{s.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.quantity} {getUnits(getLocale()).find((u) => u.id === s.unit)?.label ?? s.unit}
                    {s.existingId ? ` · ${T("tile.suggestLink")}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-primary" title={String(s.relevance)}>{stars(s.relevance)}</span>
              </label>
            ))}
          </div>
        )}
        {items && items.length > 0 && (
          <Button variant="outline" className="w-full" disabled={busy} onClick={() => void load(true)}>{busy ? T("tile.suggestBusy") : T("tile.suggestMore")}</Button>
        )}
        {items && items.length > 0 && (
          <Button className="w-full" disabled={sel.size === 0} onClick={create}>{T("tile.suggestCreate", { n: sel.size })}</Button>
        )}
      </div>
    </div>
  );
}

function CopyListDialog(p: { title: string; text: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(p.text);
      setCopied(true);
      toast.success(T("export.copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(T("export.copyFailed"));
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={p.onClose}>
      <div className="flex w-full max-w-sm flex-col gap-3 rounded-t-2xl bg-card p-4 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-bold text-foreground">{T("adm.copyListTitle", { name: p.title })}</p>
        <textarea readOnly value={p.text} rows={10}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 font-mono text-xs" />
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={p.onClose}>{T("adm.cancel")}</Button>
          <Button className="flex-1" onClick={() => void copy()}>{copied ? "✓ " : ""}{T("share.copyText")}</Button>
        </div>
      </div>
    </div>
  );
}

function VariantAddDialog(p: { prod: TileProd; run: (fn: () => Promise<unknown>, ok?: string) => Promise<void>; must: (q: PromiseLike<{ error: { message: string } | null }>) => Promise<void>; nm: (id: string, base: string) => string; onClose: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [vDrag, setVDrag] = useState<number | null>(null);
  const [vOver, setVOver] = useState<number | null>(null);
  const trVariants = useServerFn(translateVariants);
  const existing = p.prod.variants ?? [];
  const suggestFn = useServerFn(suggestVariants);
  const [askAi, setAskAi] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [count, setCount] = useState(10);
  const [sug, setSug] = useState<string[] | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const runSuggest = async () => {
    setAskAi(false); setAiBusy(true);
    try {
      const r = await suggestFn({ data: { productId: p.prod.id, count } });
      setSug(r.items); setPicked(r.items);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally { setAiBusy(false); }
  };
  const applySug = () => {
    const cur = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    const add = picked.filter((s) => !cur.some((c) => c.toLowerCase() === s.toLowerCase()));
    setText([...cur, ...add].join("\n"));
    setSug(null);
  };
  const reorder = async (from: number, to: number) => {
    if (from === to || busy) return;
    const next = [...existing];
    const moved = next[from]!;
    next.splice(from, 1);
    next.splice(to, 0, moved);
    setBusy(true);
    await p.run(async () => {
      await p.must(supabase.from("products").update({ variants: next }).eq("id", p.prod.id));
    });
    setBusy(false);
  };
  const add = async () => {
    if (busy) return;
    const vals = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    const next = [...existing];
    let added = 0;
    for (const v of vals) {
      if (!next.some((y) => y.toLowerCase() === v.toLowerCase())) { next.push(v); added++; }
    }
    if (!added) { p.onClose(); return; }
    setBusy(true);
    await p.run(async () => {
      await p.must(supabase.from("products").update({ variants: next }).eq("id", p.prod.id));
      void trVariants({ data: { productId: p.prod.id } }).catch(() => {});
    }, T("adm.variantAddDone", { n: added }));
    setBusy(false);
    p.onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={p.onClose}>
      <div className="flex w-full max-w-sm flex-col gap-3 rounded-t-2xl bg-card p-4 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-bold text-foreground">{T("adm.variantAddTitle", { name: p.nm(p.prod.id, p.prod.name) })}</p>
        {existing.length > 0 && (
          <div className="divide-y divide-border rounded-lg border border-border">
            {existing.map((v, vi) => (
              <div
                key={v}
                draggable={!busy}
                onDragStart={() => setVDrag(vi)}
                onDragOver={(e) => { e.preventDefault(); setVOver(vi); }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (vDrag !== null && vDrag !== vi) void reorder(vDrag, vi);
                  setVDrag(null); setVOver(null);
                }}
                onDragEnd={() => { setVDrag(null); setVOver(null); }}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm ${vDrag === vi ? "opacity-40" : ""} ${vOver === vi && vDrag !== null && vDrag !== vi ? "bg-primary-soft" : ""}`}
              >
                <span aria-hidden className="cursor-grab select-none text-muted-foreground">⠿</span>
                <span className="truncate">{v}</span>
              </div>
            ))}
          </div>
        )}
        {!sug && !askAi && (
          <Button type="button" variant="outline" size="sm" disabled={busy || aiBusy} onClick={() => setAskAi(true)}>
            {aiBusy ? T("adm.working") : `✨ ${T("adm.variantSuggest")}`}
          </Button>
        )}
        {askAi && (
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/40 p-3 text-sm">
            <p>{T("adm.variantSuggestConfirm")}</p>
            <label className="flex items-center gap-2">
              <span>{T("adm.suggestCount")}</span>
              <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="rounded-lg border border-input bg-background px-2 py-1">
                {[5, 10, 15].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => setAskAi(false)}>{T("adm.cancel")}</Button>
              <Button size="sm" className="flex-1" onClick={() => void runSuggest()}>✨ {T("adm.variantSuggest")}</Button>
            </div>
          </div>
        )}
        {sug && (
          <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
            {sug.length === 0 ? <p className="text-sm text-muted-foreground">{T("adm.variantSuggestNone")}</p> : (
              <div className="flex flex-wrap gap-1.5">
                {sug.map((s) => {
                  const on = picked.includes(s);
                  return (
                    <button key={s} type="button" aria-pressed={on} onClick={() => setPicked(on ? picked.filter((x) => x !== s) : [...picked, s])}
                      className={`rounded-full border px-2.5 py-1 text-xs ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground"}`}>{s}</button>
                  );
                })}
              </div>
            )}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => setSug(null)}>{T("adm.cancel")}</Button>
              <Button size="sm" className="flex-1" disabled={!picked.length} onClick={applySug}>{T("adm.variantSuggestApply")}</Button>
            </div>
          </div>
        )}
        <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder={T("adm.variantAddHint")}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" />
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={p.onClose}>{T("adm.cancel")}</Button>
          <Button className="flex-1" disabled={busy || !text.trim()} onClick={() => void add()}>{busy ? T("adm.working") : T("adm.variantAdd")}</Button>
        </div>
      </div>
    </div>
  );
}

/** Übersetzungen eines Eintrags im Produkt-Dialog – pro Sprache ein Feld mit KI-Knopf. */
function SheetTranslations({ kind, id, baseName }: { kind: "product" | "department"; id: string; baseName: string }) {
  const [rows, setRows] = useState<Record<string, { name: string; is_manual: boolean }>>({});
  useEffect(() => {
    let off = false;
    void supabase.from("catalog_translations").select("locale, name, is_manual").eq("entity_id", id).then(({ data }) => {
      if (off) return;
      const map: Record<string, { name: string; is_manual: boolean }> = {};
      for (const r of (data ?? []) as { locale: string; name: string; is_manual: boolean }[]) map[r.locale] = { name: r.name, is_manual: r.is_manual };
      setRows(map);
    });
    return () => { off = true; };
  }, [id]);

  const save = (locale: string, v: string) => {
    if ((rows[locale]?.name ?? "") === v.trim()) return;
    setRows((o) => ({ ...o, [locale]: { name: v.trim(), is_manual: true } }));
    if (v.trim()) {
      void supabase.from("catalog_translations").upsert(
        { entity_type: kind, entity_id: id, locale, name: v.trim(), is_manual: true },
        { onConflict: "entity_type,entity_id,locale" },
      ).then(({ error }) => error && toast.error(error.message));
    } else {
      void supabase.from("catalog_translations").delete().eq("entity_id", id).eq("locale", locale);
    }
  };

  return (
    <div className="space-y-1.5">
      <h3 className="text-sm font-semibold text-foreground">{T("adm.languages")}</h3>
      <div className="space-y-1.5">
        {allLocales().map((l) => (
          <SheetTrField key={l.id + (rows[l.id]?.name ?? "")} label={`${l.flag} ${l.id}`} value={rows[l.id]?.name ?? ""} manual={rows[l.id]?.is_manual}
            locale={l.id} source={baseName.trim()} onSave={(v) => save(l.id, v)} />
        ))}
      </div>
    </div>
  );
}

function SheetTrField({ label, value, manual, locale, source, onSave }: { label: string; value: string; manual?: boolean | undefined; locale: string; source: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  const [busy, setBusy] = useState(false);
  const trFn = useServerFn(translateSingleName);
  const aiTranslate = async () => {
    if (!source) return;
    setBusy(true);
    try {
      const r = await trFn({ data: { name: source, locale } });
      if (r.name) { setV(r.name); onSave(r.name); }
      else toast.error(T("adm.aiTrEmpty"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  };
  return (
    <div className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <input aria-label={label} value={v} onChange={(e) => setV(e.target.value)} onBlur={() => onSave(v)}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        className={`min-w-0 rounded-lg border px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary ${manual ? "border-primary bg-primary-soft/30" : "border-input bg-background"}`} />
      <Button type="button" size="sm" variant="outline" disabled={busy || !source} onClick={() => void aiTranslate()}
        aria-label={T("adm.aiTrOne", { l: locale })} title={T("adm.aiTrOne", { l: locale })} className="h-8 px-2">
        {busy ? "…" : "✨"}
      </Button>
    </div>
  );
}
