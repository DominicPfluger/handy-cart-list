import { useEffect, useState } from "react";
import type { CatalogProduct } from "../lib/catalog-query";
import { getUnits, formatQuantity, type UnitId } from "../lib/units";
import { useT } from "../i18n";

import { useShoppingList } from "../hooks/use-shopping-list";
import { usePantry } from "../hooks/use-pantry";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
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
  onOpenChange: (open: boolean) => void;
}

export function CatalogProductDialog({
  product,
  groupLabel,
  groupEmoji,
  onOpenChange,
}: CatalogProductDialogProps) {
  const { addCatalogItem } = useShoppingList();
  const pantry = usePantry();
  const pantryEntry = product ? pantry.isInPantry(product.id) : undefined;
  const { t, locale } = useT();
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState<UnitId>("stueck");
  const [organic, setOrganic] = useState(false);
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!product) return;
    setQuantity(String(product.defaultQuantity));
    setUnit(product.defaultUnit as UnitId);
    setOrganic(false);
    setNote("");
    setSelected([]);
    setCustom([]);
    setCustomInput("");
    setExpanded(false);
  }, [product]);

  const toggleVariant = (v: string) =>
    setSelected((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const addCustom = () => {
    const v = customInput.trim();
    if (!v) return;
    if (!custom.includes(v) && !(product?.variants ?? []).includes(v)) setCustom((c) => [...c, v]);
    setSelected((prev) => (prev.includes(v) ? prev : [...prev, v]));
    setCustomInput("");
  };

  const amount = Number(quantity.replace(",", "."));
  const validAmount = Number.isFinite(amount) && amount > 0;

  const addProduct = () => {
    if (!product || !validAmount) return;
    const pending = customInput.trim();
    const sorts = pending && !selected.includes(pending) ? [...selected, pending] : selected;
    const names = sorts.length ? sorts.map((v) => `${product.name} · ${v}`) : [product.name];
    for (const name of names) addCatalogItem({
      productId: product.id,
      name,
      quantity: formatQuantity(amount, unit),
      unit,
      organic,
      emoji: product.emoji,
      imageUrl: product.imageUrl,
      groupLabel,
      groupEmoji: groupEmoji ?? undefined,
      note,
    });
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
            <Select value={unit} onValueChange={(value) => setUnit(value as UnitId)}>
              <SelectTrigger className="h-11 rounded-xl bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {getUnits(locale).map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    {entry.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {product?.organicAvailable && (
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
            const all = [...(product?.variants ?? []), ...custom];
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
                        {v}
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

        {pantryEntry && (
          <p className="rounded-xl bg-primary-soft/30 px-3 py-2 text-xs text-muted-foreground">
            🏠 {t("pantry.inPantry", { qty: pantryEntry.quantity })}
          </p>
        )}

        <DialogFooter className="mt-2">
          <Button
            type="button"
            onClick={addProduct}
            disabled={!validAmount}
            className="h-11 w-full rounded-xl font-semibold"
          >
            {selected.length > 1 ? t("dlg.addN", { n: selected.length }) : t("dlg.addToList")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}