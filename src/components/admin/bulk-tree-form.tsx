import { useState } from "react";
import { Button } from "@/components/ui/button";
import { t as T } from "@/i18n";

export type TreeBlock = { name: string; items: string[] };

export function parseTree(text: string): TreeBlock[] {
  return text.split(/\r?\n\s*\r?\n/).map((blk) => {
    const lines = blk.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const seen = new Set<string>();
    const items = lines.slice(1).filter((l) => { const k = l.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
    return { name: lines[0] ?? "", items };
  }).filter((b) => b.name);
}

export function BulkTreeForm({ existing, onSubmit, onCancel }: { existing: string[]; onSubmit: (b: TreeBlock[]) => void; onCancel: () => void }) {
  const [text, setText] = useState("");
  const blocks = parseTree(text);
  const ex = new Set(existing.map((x) => x.trim().toLowerCase()));
  const n = blocks.reduce((s, b) => s + b.items.length, 0);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div role="dialog" aria-label={T("adm.bulkTree")} className="flex max-h-[90vh] w-full max-w-lg flex-col gap-3 overflow-y-auto rounded-2xl bg-card p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <p className="text-base font-bold text-foreground">📂 {T("adm.bulkTree")}</p>
        <p className="text-xs text-muted-foreground">{T("adm.bulkTreeHint")}</p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={12} autoFocus
          placeholder={"Fruchtgemüse\nTomaten\nGurken\n\nBlattgemüse\nSpinat"}
          className="w-full rounded-xl border border-input bg-background p-3 text-sm" />
        {blocks.length > 0 && (
          <div className="rounded-xl border border-border p-3 text-sm">
            <p className="mb-2 font-semibold text-foreground">{T("adm.bulkTreePreview", { cats: blocks.length, n })}</p>
            <ul className="space-y-1">
              {blocks.map((b, i) => (
                <li key={i}>
                  <span className="font-semibold">{b.name}</span>
                  {ex.has(b.name.toLowerCase()) && <span className="ml-1 text-xs text-muted-foreground">({T("adm.bulkTreeExists")})</span>}
                  <span className="text-muted-foreground"> · {b.items.join(", ")}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>{T("adm.cancel")}</Button>
          <Button disabled={!blocks.length} onClick={() => onSubmit(blocks)}>{T("adm.bulkTreeCreate")}</Button>
        </div>
      </div>
    </div>
  );
}
