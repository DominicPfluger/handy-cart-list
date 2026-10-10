import { useEffect, useRef, useState } from "react";
import { EyeOff } from "lucide-react";
import { toast } from "sonner";
import { prepareItemPhoto } from "../lib/item-photo-store";
import { brandsFor, departmentIdsOf, pathTo, useCatalog, type CatalogProduct } from "../lib/catalog-query";
import { usePreferredDept } from "../hooks/use-preferred-dept";
import { useMarket } from "../hooks/use-market";
import { getUnits, formatQuantity, unitLabel, type UnitId } from "../lib/units";
import { preferredUnits, quantityForUnit, sortByPreferred } from "../lib/product-units";
import { useT, pickName } from "../i18n";
import { useStandardVariants } from "../hooks/use-standard-variants";

import { useShoppingList } from "../hooks/use-shopping-list";
import { getFavoriteQuantity } from "../hooks/use-favorite-quantity";
import { usePantry } from "../hooks/use-pantry";
import { hideProduct } from "../hooks/use-hidden-products";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface CatalogProductDialogProps {
  product: CatalogProduct | null;
  groupLabel?: string | undefined;
  groupEmoji?: string | null | undefined;
  initialBrand?: string | undefined;
  /** Vorausgewählte Variante (z. B. beim Öffnen aus einer Varianten-Zeile). */
  initialVariant?: string | undefined;
  /** Kategorie, aus der das Produkt geöffnet wurde (für Alias-Produkte). */
  initialDepartmentId?: string | undefined;
  onOpenChange: (open: boolean) => void;
}

export function CatalogProductDialog({
  product,
  groupLabel,
  groupEmoji,
  initialBrand,
  initialVariant,
  initialDepartmentId,
  onOpenChange,
}: CatalogProductDialogProps) {
  const catalog = useCatalog();
  const market = useMarket();
  const { preferred, setPreferred } = usePreferredDept();
  const deptIds = product ? departmentIdsOf(product, catalog.productAliases ?? []).filter((id) => catalog.departments.some((d) => d.id === id)) : [];
  const prefUnits = product ? preferredUnits(product, catalog.departments) : [];
  const [deptId, setDeptId] = useState<string>("");
  const { addCatalogItem, activeList } = useShoppingList();
  const pantry = usePantry();
  const pantryEntry = product ? pantry.isInPantry(product.id) : undefined;
  const { t, locale } = useT();
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState<UnitId>("stueck");
  const [organic, setOrganic] = useState(false);
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<Blob | undefined>(undefined);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [photoBusy, setPhotoBusy] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl); }, [photoUrl]);
  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setPhotoBusy(true);
    try {
      const blob = await prepareItemPhoto(file);
      setPhoto(blob);
      setPhotoUrl(URL.createObjectURL(blob));
    } catch {
      /* Foto konnte nicht verarbeitet werden */
    } finally {
      setPhotoBusy(false);
    }
  };
  const clearPhoto = () => { setPhoto(undefined); setPhotoUrl(undefined); };
  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [brand, setBrand] = useState<string | undefined>(undefined);
  // Eigenschafts-Varianten: frei kombinierbare Zusätze aus dem Admin-Pool (z. B. vegan, laktosefrei)
  const standardVariants = useStandardVariants();
  const propertyPool = standardVariants.filter((p) => !(product?.variants ?? []).includes(p.value));
  const [props, setProps] = useState<string[]>([]);
  const [hideConfirm, setHideConfirm] = useState(false);
  const hideNow = () => {
    if (!product) return;
    hideProduct(product.id);
    setHideConfirm(false);
    onOpenChange(false);
  };

  useEffect(() => {
    if (!product) return;
    const favQty = getFavoriteQuantity(product.id);
    setQuantity(String(favQty?.quantity ?? product.defaultQuantity));
    setUnit((favQty?.unit ?? product.defaultUnit) as UnitId);
    setOrganic(false);
    setNote("");
    setPhoto(undefined);
    setPhotoUrl(undefined);
    setSelected([]);
    setCustom([]);
    setCustomInput("");
    setExpanded(false);
    setProps([]);
    setBrand(initialBrand);
    setSelected(initialVariant && (product.variants ?? []).includes(initialVariant) ? [initialVariant] : []);
    const ids = departmentIdsOf(product, catalog.productAliases ?? []);
    const pref = preferred[product.id];
    setDeptId(initialDepartmentId && ids.includes(initialDepartmentId) ? initialDepartmentId : pref && ids.includes(pref) ? pref : product.departmentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, initialBrand, initialVariant, initialDepartmentId]);
  const chosenDept = deptIds.length > 1 ? catalog.departments.find((d) => d.id === deptId) : undefined;

  const toggleVariant = (v: string) =>
    setSelected((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const addCustom = () => {
    const v = customInput.trim();
    if (!v) return;
    if (!custom.includes(v) && !(product?.variants ?? []).includes(v)) setCustom((c) => [...c, v]);
    setSelected((prev) => (prev.includes(v) ? prev : [...prev, v]));
    setCustomInput("");
  };

  const vName = (v: string) => pickName(product?.variantNames?.[v], locale, v);

  const amount = Number(quantity.replace(",", "."));
  const validAmount = Number.isFinite(amount) && amount > 0;

  const addProduct = () => {
    if (!product || !validAmount) return;
    const pending = customInput.trim();
    const sorts = pending && !selected.includes(pending) ? [...selected, pending] : selected;
    const propSuffix = propertyPool.filter((p) => props.includes(p.value)).map((p) => p.label).join(", ");
    const sorted = sorts.length ? sorts.map((v) => `${product.name} · ${vName(v)}`) : [product.name];
    const base = propSuffix ? sorted.map((n) => `${n} · ${propSuffix}`) : sorted;
    const names = brand ? base.map((n) => `${n} · ${brand}`) : base;
    for (const name of names) addCatalogItem({
      productId: product.id,
      departmentId: product.departmentId,
      name,
      quantity: formatQuantity(amount, unit),
      unit,
      organic,
      emoji: product.emoji,
      imageUrl: product.imageUrl,
      groupLabel: chosenDept?.name ?? groupLabel,
      groupEmoji: (chosenDept ? chosenDept.emoji : groupEmoji) ?? undefined,
      note,
      photo,
    });
    if (chosenDept) setPreferred(product.id, chosenDept.id);
    const shown = names.length === 1 ? names[0]! : `${product.name} (${names.length})`;
    toast.success(activeList?.name ? t("common.addedToNamedList", { name: shown, list: activeList.name }) : t("common.addedToList", { name: shown }));
    onOpenChange(false);
  };

  return (
    <Dialog open={Boolean(product)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-2xl p-5">
        <DialogHeader className="pr-7 text-left">
          <DialogTitle>{product?.name ?? t("dlg.add")}</DialogTitle>
          <DialogDescription>{t("dlg.desc")}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-3 py-2">
          <div className="space-y-2">
            <Label htmlFor="catalog-quantity">{t("dlg.qty")}</Label>
            <Input
              id="catalog-quantity"
              inputMode="decimal"
              min="0.01"
              step="any"
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className="h-11 rounded-xl bg-card"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("dlg.unit")}</Label>
            <Select value={unit} onValueChange={(value) => { setUnit(value as UnitId); if (product) setQuantity(String(quantityForUnit(product, value))); }}>
              <SelectTrigger className="h-11 rounded-xl bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {sortByPreferred(getUnits(locale), prefUnits).map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    {entry.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {prefUnits.length > 1 && (
          <div className="-mt-1 flex flex-wrap gap-1.5">
            {prefUnits.map((u) => (
              <button key={u} type="button" aria-pressed={unit === u} onClick={() => { setUnit(u as UnitId); if (product) setQuantity(String(quantityForUnit(product, u))); }}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${unit === u ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"}`}>
                {unitLabel(u, locale)}
              </button>
            ))}
          </div>
        )}

        {deptIds.length > 1 && (
          <div className="space-y-2">
            <Label>{t("palias.listUnder")}</Label>
            <Select value={deptId} onValueChange={setDeptId}>
              <SelectTrigger className="h-11 rounded-xl bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                {deptIds.map((id) => (
                  <SelectItem key={id} value={id}>{pathTo(catalog.departments, id).map((d) => d.name).join(" › ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {product && brandsFor(product, market).length > 0 && (
          <div className="space-y-2">
            <Label>{t("brand.title")}</Label>
            <div className="flex flex-wrap gap-1.5">
              {brandsFor(product, market).map((b) => (
                <button key={b} type="button" aria-pressed={brand === b} onClick={() => setBrand(brand === b ? undefined : b)}
                  className={`rounded-full border px-3 py-1 text-xs ${brand === b ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"}`}>
                  {b}
                </button>
              ))}
            </div>
          </div>
        )}

        {product?.variants.some((v) => v.trim().toLowerCase() === "bio") && (
          <Label
            htmlFor="catalog-organic"
            className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl bg-primary-soft/30 px-3 py-2"
          >
            <Checkbox
              id="catalog-organic"
              checked={organic}
              onCheckedChange={(checked) => setOrganic(checked === true)}
              className="h-5 w-5 rounded-md"
            />
            <span className="text-sm font-medium text-foreground">{t("dlg.organic")}</span>
          </Label>
        )}

        <div className="space-y-2">
          <Label htmlFor="catalog-variant">{t("dlg.variant")}</Label>
          {(() => {
            const all = [...(product?.variants ?? []), ...custom].filter((v) => v.trim().toLowerCase() !== "bio");
            if (all.length === 0) return null;
            const limit = 12;
            const collapsible = all.length > limit;
            const visible = expanded || !collapsible ? all : all.slice(0, limit);
            return (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {visible.map((v) => {
                    const on = selected.includes(v);
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => toggleVariant(v)}
                        aria-pressed={on}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          on
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-foreground"
                        }`}
                      >
                        {vName(v)}
                      </button>
                    );
                  })}
                </div>
                {collapsible && (
                  <button
                    type="button"
                    onClick={() => setExpanded((prev) => !prev)}
                    className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                  >
                    {expanded ? t("dlg.showLess") : t("dlg.showAll", { n: all.length })}
                  </button>
                )}
              </>
            );
          })()}
          <div className="flex gap-2">
            <Input
              id="catalog-variant"
              type="text"
              value={customInput}
              onChange={(event) => setCustomInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addCustom();
                }
              }}
              placeholder={t("dlg.variantPlaceholder")}
              maxLength={40}
              className="h-10 rounded-xl bg-card"
            />
            <Button type="button" variant="outline" onClick={addCustom} disabled={!customInput.trim()} className="h-10 rounded-xl">
              +
            </Button>
          </div>
        </div>

        {propertyPool.length > 0 && (
          <div className="space-y-2">
            <Label>{t("dlg.properties")}</Label>
            <div className="flex flex-wrap gap-1.5">
              {propertyPool.map((p) => {
                const on = props.includes(p.value);
                return (
                  <button key={p.value} type="button" aria-pressed={on} onClick={() => setProps((prev) => (on ? prev.filter((x) => x !== p.value) : [...prev, p.value]))}
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"}`}>
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="catalog-note">{t("dlg.note")}</Label>
          <Input
            id="catalog-note"
            type="text"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t("dlg.notePlaceholder")}
            maxLength={120}
            className="h-11 rounded-xl bg-card"
          />
        </div>

        <div className="space-y-2">
          <Label>{t("dlg.photoNote")}</Label>
          <div className="flex items-center gap-3">
            {photoUrl && (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border">
                <img src={photoUrl} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={clearPhoto} aria-label={t("dlg.photoRemove")} className="absolute right-0.5 top-0.5 grid h-6 w-6 place-items-center rounded-full bg-background/90 text-xs text-foreground">✕</button>
              </div>
            )}
            <Button type="button" variant="outline" onClick={() => photoInput.current?.click()} disabled={photoBusy} className="h-11 flex-1 rounded-xl">
              {photoBusy ? "…" : `📷 ${t("dlg.photoTake")}`}
            </Button>
          </div>
          <input
            ref={photoInput}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => { pickPhoto(e.target.files?.[0]); e.target.value = ""; }}
          />
        </div>

        {pantryEntry && (
          <p className="rounded-xl bg-primary-soft/30 px-3 py-2 text-xs text-muted-foreground">
            🏠 {t("pantry.inPantry", { qty: pantryEntry.quantity })}
          </p>
        )}

        <DialogFooter className="mt-2 gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setHideConfirm(true)}
            className="h-11 rounded-xl text-destructive"
          >
            <EyeOff className="h-4 w-4" /> {t("dlg.hide")}
          </Button>
          <Button
            type="button"
            onClick={addProduct}
            disabled={!validAmount}
            className="h-11 flex-1 rounded-xl font-semibold"
          >
            {selected.length > 1 ? t("dlg.addN", { n: selected.length }) : t("dlg.addToList")}
          </Button>
        </DialogFooter>
      </DialogContent>
      <AlertDialog open={hideConfirm} onOpenChange={setHideConfirm}>
        <AlertDialogContent className="max-w-[400px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("rename.confirmRemoveTitle", { name: product?.name ?? "" })}</AlertDialogTitle>
            <AlertDialogDescription>{t("rename.confirmRemoveCatalog")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("rename.confirmCancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={hideNow}>{t("rename.confirmRemove")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
