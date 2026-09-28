import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { setCustomName } from "../hooks/use-custom-names";
import { deleteCustomEntry, isCustomId } from "../hooks/use-custom-catalog";
import { useT } from "../i18n";

export type RenameTarget = { id: string; name: string; originalName: string; isCustom: boolean };

export function RenameDialog({ target, onClose }: { target: RenameTarget | null; onClose: () => void }) {
  const { t } = useT();
  const [value, setValue] = useState("");
  useEffect(() => setValue(target?.name ?? ""), [target]);

  const save = () => {
    if (!target) return;
    const v = value.trim();
    setCustomName(target.id, v && v !== target.originalName ? v : null);
    onClose();
  };

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[400px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t("rename.title")}</DialogTitle>
          <DialogDescription>{t("rename.hint")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-2">
          <Input autoFocus value={value} maxLength={80} onChange={(e) => setValue(e.target.value)} />
          {target && <p className="text-xs text-muted-foreground">{t("rename.original", { name: target.originalName })}</p>}
        </form>
        <DialogFooter className="gap-2 sm:gap-2">
          {target && isCustomId(target.id) && (
            <Button variant="outline" className="text-destructive" onClick={() => { deleteCustomEntry(target.id); setCustomName(target.id, null); onClose(); }}>{t("rename.delete")}</Button>
          )}
          {target?.isCustom && !isCustomId(target.id) && (
            <Button variant="outline" onClick={() => { setCustomName(target.id, null); onClose(); }}>{t("rename.reset")}</Button>
          )}
          <Button onClick={save} disabled={!value.trim()}>{t("rename.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
