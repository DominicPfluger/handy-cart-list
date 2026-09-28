import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { addCustomDepartment, addCustomProduct } from "../hooks/use-custom-catalog";
import { getUnits } from "../lib/units";
import { useT } from "../i18n";

export type AddEntryTarget = { kind: "department" | "product"; parentId: string | null; parentName?: string | undefined };

export function AddEntryDialog({ target, onClose }: { target: AddEntryTarget | null; onClose: () => void }) {
  const { t } = useT();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [qty, setQty] = useState("1");
  const [unit, setUnit] = useState("stueck");
  useEffect(() => { setName(""); setEmoji(""); setQty("1"); setUnit("stueck"); }, [target]);

  const save = () => {
    if (!target || !name.trim()) return;
    if (target.kind === "department") {
      addCustomDepartment({ parentId: target.parentId, name: name.trim(), emoji: emoji.trim() || null });
    } else if (target.parentId) {
      const q = Number(qty.replace(",", "."));
      addCustomProduct({ departmentId: target.parentId, name: name.trim(), emoji: emoji.trim() || null, defaultQuantity: q > 0 ? q : 1, defaultUnit: unit });
    }
    onClose();
  };

  const isProduct = target?.kind === "product";
  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[400px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>{isProduct ? t("add.productTitle") : t("add.categoryTitle")}</DialogTitle>
          <DialogDescription>
            {target?.parentName ? t("add.in", { name: target.parentName }) : t("add.topLevel")} {t("add.hint")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-3">
          <div className="flex gap-2">
            <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder={isProduct ? "🛒" : "🧺"} maxLength={4} className="w-16 text-center" aria-label={t("add.emoji")} />
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={t("add.name")} maxLength={80} />
          </div>
          {isProduct && (
            <div className="flex gap-2">
              <Input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="decimal" className="w-24" aria-label={t("add.quantity")} />
              <select value={unit} onChange={(e) => setUnit(e.target.value)} className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm" aria-label={t("add.unit")}>
                {getUnits().map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
              </select>
            </div>
          )}
          <button type="submit" hidden />
        </form>
        <DialogFooter>
          <Button onClick={save} disabled={!name.trim()}>{t("add.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
