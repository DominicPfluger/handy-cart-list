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