import { useState } from "react";
import { toast } from "sonner";
import { useT } from "../i18n";

export interface ExportItem {
  name: string;
  quantity: string;
  unit: string;
  organic: boolean;
  note: string;
  checked: boolean;
}
export interface ExportGroup {
  label: string;
  items: ExportItem[];
}

function splitBrand(name: string): { name: string; brand: string } {
  const parts = name.split(" · ");
  if (parts.length < 2) return { name, brand: "" };
  return { name: parts.slice(0, -1).join(" · "), brand: parts[parts.length - 1] ?? "" };
}

function fileBase(title: string) {
  const d = new Date();
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const safe = title.replace(/[\\/:*?"<>|]+/g, "").trim().replace(/\s+/g, "-") || "Liste";
  return `${safe}-${date}`;
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ExportListButton({ title, groups }: { title: string; groups: ExportGroup[] }) {
  const { t, locale } = useT();
  const [open, setOpen] = useState(false);
  const [withChecked, setWithChecked] = useState(false);

  const filtered = groups
    .map((g) => ({ ...g, items: g.items.filter((i) => withChecked || !i.checked) }))
    .filter((g) => g.items.length);
  const count = filtered.reduce((n, g) => n + g.items.length, 0);

  const exportCsv = () => {
    const q = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const head = [t("export.colItem"), t("export.colQty"), t("export.colUnit"), t("export.colBrand"), t("export.colOrganic"), t("export.colCategory"), t("export.colNote")];
    const rows = [head.map(q).join(";")];
    for (const g of filtered) for (const i of g.items) {
      const { name, brand } = splitBrand(i.name);
      const num = i.quantity.match(/^[\d.,]+/)?.[0];
      rows.push([name, num ?? i.quantity, i.unit || (num ? i.quantity.slice(num.length).trim() : ""), brand, i.organic ? t("export.yes") : "", g.label, i.note].map(q).join(";"));
    }
    download(new Blob(["\uFEFF" + rows.join("\r\n")], { type: "text/csv;charset=utf-8" }), `${fileBase(title)}.csv`);
    setOpen(false);
  };

  const exportPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const left = 18, bottom = 280;
    let y = 22;
    doc.setFont("helvetica", "bold"); doc.setFontSize(18);
    doc.text(title, left, y);
    y += 7;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(110);
    doc.text(`${new Date().toLocaleDateString(locale)} · ${t("export.items", { n: count })}`, left, y);
    doc.setTextColor(0);
    y += 8;
    const ensure = (h: number) => { if (y + h > bottom) { doc.addPage(); y = 20; } };
    for (const g of filtered) {
      ensure(14);
      y += 3;
      doc.setFont("helvetica", "bold"); doc.setFontSize(12);
      doc.text(g.label, left, y);
      y += 6;
      doc.setFont("helvetica", "normal"); doc.setFontSize(11);
      for (const i of g.items) {
        const extra = [i.organic ? t("common.organic") : "", i.note].filter(Boolean).join(" · ");
        const lines = doc.splitTextToSize(`${i.quantity ? i.quantity + "  " : ""}${i.name}${extra ? ` (${extra})` : ""}`, 165) as string[];
        ensure(lines.length * 5 + 2);
        doc.rect(left, y - 3.5, 4, 4);
        if (i.checked) doc.line(left, y - 1.5, left + 4, y - 1.5);
        doc.text(lines, left + 7, y);
        y += lines.length * 5 + 1.5;
      }
    }
    download(doc.output("blob"), `${fileBase(title)}.pdf`);
    setOpen(false);
  };

  const copyText = async () => {
    const text = filtered.flatMap((g) => g.items.map((i) => `${i.quantity ? i.quantity + " " : ""}${i.name}`)).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("export.copied"));
      setOpen(false);
    } catch {
      toast.error(t("export.copyFailed"));
    }
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={t("export.title")} title={t("export.title")}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-primary active:bg-muted">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" />
        </svg>
      </button>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-foreground/40 sm:items-center" onClick={() => setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label={t("export.title")} onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[440px] space-y-3 rounded-t-2xl bg-background p-5 sm:rounded-2xl">
            <h2 className="text-lg font-semibold text-foreground">{t("export.title")}</h2>
            <p className="text-xs text-muted-foreground">{t("export.hint")}</p>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={withChecked} onChange={(e) => setWithChecked(e.target.checked)} className="h-4 w-4 accent-primary" />
              {t("export.withChecked")}
            </label>
            <div className="grid gap-2">
              <button type="button" disabled={!count} onClick={copyText} className="rounded-xl bg-primary px-4 py-3 text-left text-sm font-semibold text-primary-foreground disabled:opacity-40">📋 {t("export.copy")}</button>
              <button type="button" disabled={!count} onClick={exportCsv} className="rounded-xl border border-border bg-card px-4 py-3 text-left text-sm font-medium text-foreground disabled:opacity-40">📊 {t("export.csv")}</button>
              <button type="button" disabled={!count} onClick={() => void exportPdf()} className="rounded-xl border border-border bg-card px-4 py-3 text-left text-sm font-medium text-foreground disabled:opacity-40">📄 {t("export.pdf")}</button>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="w-full py-2 text-sm text-muted-foreground">{t("common.cancel")}</button>
          </div>
        </div>
      )}
    </>
  );
}
