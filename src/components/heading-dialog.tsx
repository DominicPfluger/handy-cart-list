import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { deleteHeading, saveHeading } from "../lib/admin.functions";
import type { CatalogHeading, CatalogProduct } from "../lib/catalog-query";
import { useT } from "../i18n";

export type HeadingTarget = { departmentId: string; products: CatalogProduct[]; heading?: CatalogHeading };

export function HeadingDialog({ target, onClose }: { target: HeadingTarget | null; onClose: () => void }) {
  const { t } = useT();
  const qc = useQueryClient();
  const save = useServerFn(saveHeading);
  const remove = useServerFn(deleteHeading);
  const [name, setName] = useState("");
  const [before, setBefore] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setName(target?.heading?.baseName ?? "");
    setBefore(target?.heading?.beforeProductId ?? target?.products[0]?.id ?? "");
  }, [target]);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      await qc.invalidateQueries({ queryKey: ["catalog"] });
      toast.success(t("heading.saved"));
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const submit = () => {
    if (!target || !name.trim() || !before) return;
    const changedName = name.trim() !== target.heading?.baseName;
    void run(() => save({ data: { id: target.heading?.id, departmentId: target.departmentId, beforeProductId: before, ...(changedName ? { name: name.trim() } : {}) } }));
  };

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[400px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>{target?.heading ? t("heading.edit") : t("heading.title")}</DialogTitle>
          <DialogDescription>{t("heading.hint")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-3">
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={t("add.name")} maxLength={80} />
          <label className="block text-xs font-medium text-muted-foreground">
            {t("heading.before")}
            <select value={before} onChange={(e) => setBefore(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">
              {target?.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <button type="submit" hidden />
        </form>
        <DialogFooter className="gap-2">
          {target?.heading && (
            <Button variant="ghost" className="text-destructive" disabled={busy} onClick={() => void run(() => remove({ data: { id: target.heading!.id } }))}>
              {t("heading.delete")}
            </Button>
          )}
          <Button onClick={submit} disabled={busy || !name.trim() || !before}>{t("add.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
