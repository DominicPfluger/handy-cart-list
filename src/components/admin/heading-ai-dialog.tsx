import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { suggestHeadings } from "@/lib/admin.functions";
import { useT } from "@/i18n";

type P = { id: string; name: string; emoji: string | null };
export type HeadingGroup = { name: string; productIds: string[] };

export function HeadingAiDialog({ open, onOpenChange, path, products, hasHeadings, onApply, nm }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  path: string;
  products: P[];
  hasHeadings: boolean;
  onApply: (groups: HeadingGroup[]) => Promise<void>;
  nm: (id: string, name: string) => string;
}) {
  const T = useT();
  const suggest = useServerFn(suggestHeadings);
  const [keywords, setKeywords] = useState("");
  const [groups, setGroups] = useState<HeadingGroup[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const byId = new Map(products.map((p) => [p.id, p]));

  const load = async () => {
    setLoading(true);
    try {
      const r = await suggest({ data: { path, products: products.map((p) => ({ id: p.id, name: p.name })), keywords } });
      setGroups(r.groups);
    } catch (e) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  };

  const apply = async () => {
    if (!groups) return;
    if (hasHeadings && !confirm(T("adm.headingAi.replace"))) return;
    setSaving(true);
    try { await onApply(groups.filter((g) => g.name.trim())); onOpenChange(false); setGroups(null); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setGroups(null); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>✨ {T("adm.headingAi.title")}</DialogTitle></DialogHeader>
        <p className="text-xs text-muted-foreground">{path}</p>
        <div className="flex gap-2">
          <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder={T("adm.headingAi.keywords")} />
          <Button variant="outline" disabled={loading || saving} onClick={() => void load()}>
            {loading ? T("adm.working") : groups ? T("adm.headingAi.again") : T("adm.headingAi.go")}
          </Button>
        </div>
        {groups && (
          <div className="space-y-3">
            {groups.map((g, gi) => (
              <div key={gi} className="rounded-lg border border-border p-2">
                <Input value={g.name} className="h-9 font-bold"
                  onChange={(e) => setGroups(groups.map((x, i) => (i === gi ? { ...x, name: e.target.value } : x)))} />
                <ul className="mt-1 space-y-0.5 pl-1 text-sm">
                  {g.productIds.map((id) => { const p = byId.get(id); return p ? <li key={id}>{p.emoji ?? "•"} {nm(p.id, p.name)}</li> : null; })}
                </ul>
              </div>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{T("adm.cancel")}</Button>
          <Button disabled={!groups || saving} onClick={() => void apply()}>{saving ? T("adm.working") : T("adm.headingAi.apply")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
