import { useEffect, useState } from "react";
import type { CatalogProduct } from "../lib/catalog-query";
import { UNITS, formatQuantity, type UnitId } from "../lib/units";
import { useShoppingList } from "../hooks/use-shopping-list";
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
  groupLabel?: string;
  groupEmoji?: string | null;
  onOpenChange: (open: boolean) => void;
}

export function CatalogProductDialog({
  product,
  groupLabel,
  groupEmoji,
  onOpenChange,
}: CatalogProductDialogProps) {
  const { addCatalogItem } = useShoppingList();
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState<UnitId>("stueck");
  const [organic, setOrganic] = useState(false);

  useEffect(() => {
    if (!product) return;
    setQuantity(String(product.defaultQuantity));
    setUnit(product.defaultUnit as UnitId);
    setOrganic(false);
  }, [product]);

  const amount = Number(quantity.replace(",", "."));
  const validAmount = Number.isFinite(amount) && amount > 0;

  const addProduct = () => {
    if (!product || !validAmount) return;
    addCatalogItem({
      productId: product.id,
      name: product.name,
      quantity: formatQuantity(amount, unit),
      unit,
      organic,
      emoji: product.emoji,
      imageUrl: product.imageUrl,
      groupLabel,
      groupEmoji: groupEmoji ?? undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={Boolean(product)} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-2xl p-5">
        <DialogHeader className="pr-7 text-left">
          <DialogTitle>{product?.name ?? "Produkt hinzufügen"}</DialogTitle>
          <DialogDescription>Lege Menge und gewünschte Variante fest.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-3 py-2">
          <div className="space-y-2">
            <Label htmlFor="catalog-quantity">Menge</Label>
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
            <Label>Masseinheit</Label>
            <Select value={unit} onValueChange={(value) => setUnit(value as UnitId)}>
              <SelectTrigger className="h-11 rounded-xl bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {UNITS.map((entry) => (
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
            <span className="text-sm font-medium text-foreground">Bio-Produkt</span>
          </Label>
        )}

        <DialogFooter className="mt-2">
          <Button
            type="button"
            onClick={addProduct}
            disabled={!validAmount}
            className="h-11 w-full rounded-xl font-semibold"
          >
            Zur Einkaufsliste hinzufügen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}