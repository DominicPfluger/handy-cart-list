import { useEffect, useRef, useState } from "react";
import { useT } from "../i18n";
import { useShoppingList } from "../hooks/use-shopping-list";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";

const SESSION_KEY = "shoppi:list-chosen";

function chosenThisSession(): boolean {
  try { return window.sessionStorage.getItem(SESSION_KEY) === "1"; } catch { return false; }
}

/** Fragt einmal pro App-Sitzung nach der Ziel-Einkaufsliste (nur bei mehreren Listen).
 *  `gate(run)` führt `run` sofort aus oder nach der Auswahl – dann erst nach dem
 *  Neu-Rendern, damit `run` die neu aktive Liste sieht (über Refs aufrufen). */
export function useListChoiceGate() {
  const { t } = useT();
  const { lists, activeList, setActiveListId } = useShoppingList();
  const [open, setOpen] = useState(false);
  const pendingRef = useRef<(() => void) | null>(null);
  const [waitFor, setWaitFor] = useState<string | null>(null);

  useEffect(() => {
    if (waitFor && activeList.id === waitFor) {
      setWaitFor(null);
      const run = pendingRef.current;
      pendingRef.current = null;
      run?.();
    }
  }, [waitFor, activeList.id]);

  const gate = (run: () => void) => {
    if (lists.length <= 1 || chosenThisSession()) { run(); return; }
    pendingRef.current = run;
    setOpen(true);
  };

  const choose = (id: string) => {
    try { window.sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* ignore */ }
    setOpen(false);
    setActiveListId(id);
    setWaitFor(id);
  };

  const dialog = (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setOpen(false); pendingRef.current = null; } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("listPick.title")}</DialogTitle>
          <DialogDescription>{t("listPick.sub")}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-2 overflow-y-auto">
          {lists.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => choose(l.id)}
              className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left active:bg-muted ${l.id === activeList.id ? "border-primary bg-primary/10" : "border-border"}`}
            >
              <span className="min-w-0 truncate font-semibold text-foreground">{l.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{l.items.filter((i) => !i.checked).length}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );

  return { gate, dialog };
}
