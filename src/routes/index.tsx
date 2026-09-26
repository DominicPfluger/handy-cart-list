import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  useShoppingList,
  getCategory,
} from "../hooks/use-shopping-list";
import {
  CheckIcon,
  DotsIcon,
  ScanIcon,
  TrashIcon,
  PlusIcon,
  ShareIcon,
} from "../components/icons";
import { ListManager, shareList } from "../components/list-manager";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shoppi — Unsere Einkaufsliste" },
      { name: "description", content: "Die smarte Einkaufsliste für deinen Alltag. Gemeinsam. Einfach. Einkaufen." },
      { property: "og:title", content: "Shoppi — Unsere Einkaufsliste" },
      { property: "og:description", content: "Die smarte Einkaufsliste für deinen Alltag." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ListPage,
});

function ListPage() {
  const {
    items, hydrated, toggleItem, removeItem, clearChecked,
    lists, activeList, setActiveListId, createList, renameList, deleteList, reorderLists,
  } = useShoppingList();
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [managerOpen, setManagerOpen] = useState(false);

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        if (a.checked !== b.checked) return a.checked ? 1 : -1;
        return a.addedAt - b.addedAt;
      }),
    [items]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const it of sortedItems) {
      const key = it.groupLabel ?? it.category;
      if (!map.has(key)) map.set(key, []);
      const group = map.get(key);
      if (group) group.push(it);
    }
    return [...map.entries()];
  }, [sortedItems]);

  const doneCount = items.filter((i) => i.checked).length;
  const total = items.length;
  const progress = total > 0 ? (doneCount / total) * 100 : 0;

  return (
    <div className="space-y-5">
      <ListManager
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        lists={lists}
        activeId={activeList.id}
        onSelect={setActiveListId}
        onCreate={createList}
        onRename={renameList}
        onDelete={deleteList}
        onReorder={reorderLists}
      />

      {/* List switcher */}
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 no-scrollbar">
        {lists.map((l) => (
          <button
            key={l.id}
            onClick={() => setActiveListId(l.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              l.id === activeList.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {l.name}
          </button>
        ))}
        <button
          onClick={() => setManagerOpen(true)}
          className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-primary/40 px-3 py-1.5 text-xs font-semibold text-primary"
        >
          <PlusIcon className="h-3.5 w-3.5" /> Listen
        </button>
      </div>

      {/* Title + progress */}
      <div>
        <div className="flex items-center gap-2">
          <button onClick={() => setManagerOpen(true)} className="min-w-0 flex-1 text-left">
            <h1 className="truncate text-2xl font-bold tracking-tight text-foreground">{activeList.name}</h1>
          </button>
          <button
            onClick={() => shareList(activeList)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-primary active:bg-muted"
            aria-label="Liste teilen"
          >
            <ShareIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-muted-foreground">
            {doneCount}/{total}
          </span>
        </div>
      </div>

      {/* Scan button */}
      <button className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-primary-soft/30 py-3 text-sm font-semibold text-primary transition active:scale-[0.98]">
        <ScanIcon className="h-5 w-5" />
        Barcode scannen
      </button>

      {/* List grouped by category */}
      {sortedItems.length === 0 && hydrated && (
        <div className="py-16 text-center">
          <div className="text-5xl">🧺</div>
          <p className="mt-4 text-sm text-muted-foreground">
            Deine Liste ist leer.<br />Füge Artikel über „Abteilungen" hinzu!
          </p>
        </div>
      )}

      <div className="space-y-6">
        {grouped.map(([groupKey, catItems]) => {
          const firstItem = catItems[0];
          if (!firstItem) return null;
          const cat = getCategory(firstItem.category);
          const groupLabel = firstItem.groupLabel ?? cat.label;
          const groupEmoji = firstItem.groupEmoji ?? cat.emoji;
          return (
            <div key={groupKey}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-base">{groupEmoji}</span>
                <h2 className="text-sm font-semibold text-foreground">{groupLabel}</h2>
                <span className="text-xs text-muted-foreground">· {catItems.length}</span>
              </div>
              <div className="divide-y divide-border rounded-2xl border border-border bg-card">
                {catItems.map((item) => (
                  <div key={item.id} className="relative flex items-center gap-3 px-4 py-3">
                    <button
                      onClick={() => toggleItem(item.id)}
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition active:scale-90 ${
                        item.checked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30 bg-transparent"
                      }`}
                      aria-label={item.checked ? "Abwählen" : "Auswählen"}
                    >
                      {item.checked && <CheckIcon className="h-4 w-4" />}
                    </button>
                    {(item.imageUrl || item.emoji) && (
                      <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-primary-soft/25 text-xl">
                        {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : item.emoji}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-medium ${item.checked ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {item.name}{item.organic ? " (Bio)" : ""}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.quantity || "—"} · von {item.addedBy}
                      </p>
                    </div>
                    <button
                      onClick={() => setMenuOpenId(menuOpenId === item.id ? null : item.id)}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition active:scale-90"
                      aria-label="Optionen"
                    >
                      <DotsIcon className="h-5 w-5" />
                    </button>
                    {menuOpenId === item.id && (
                      <div className="absolute right-3 top-12 z-10 rounded-xl border border-border bg-popover py-1 shadow-lg">
                        <button
                          onClick={() => {
                            removeItem(item.id);
                            setMenuOpenId(null);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-xs font-medium text-coral hover:bg-muted"
                        >
                          <TrashIcon className="h-4 w-4" /> Entfernen
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Clear checked */}
      {doneCount > 0 && (
        <button
          onClick={clearChecked}
          className="w-full rounded-xl bg-muted py-3 text-sm font-semibold text-muted-foreground transition active:scale-[0.98]"
        >
          {doneCount} abgehakte Artikel entfernen
        </button>
      )}
    </div>
  );
}
