import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  useShoppingList,
  CATEGORIES,
  getCategory,
  type CategoryId,
} from "../hooks/use-shopping-list";
import {
  PlusIcon,
  SearchIcon,
  CheckIcon,
  DotsIcon,
  ScanIcon,
  TrashIcon,
} from "../components/icons";

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
  const { items, hydrated, addItem, toggleItem, removeItem, clearChecked } = useShoppingList();
  const [input, setInput] = useState("");
  const [qty, setQty] = useState("");
  const [selectedCat, setSelectedCat] = useState<CategoryId>("sonstiges");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        if (a.checked !== b.checked) return a.checked ? 1 : -1;
        return a.addedAt - b.addedAt;
      }),
    [items]
  );

  const grouped = useMemo(() => {
    const map = new Map<CategoryId, typeof items>();
    for (const it of sortedItems) {
      if (!map.has(it.category)) map.set(it.category, []);
      map.get(it.category)!.push(it);
    }
    return [...map.entries()];
  }, [sortedItems]);

  const doneCount = items.filter((i) => i.checked).length;
  const total = items.length;
  const progress = total > 0 ? (doneCount / total) * 100 : 0;

  const handleAdd = () => {
    if (!input.trim()) return;
    addItem(input, qty, selectedCat);
    setInput("");
    setQty("");
  };

  return (
    <div className="space-y-5">
      {/* Title + progress */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Unsere Einkaufsliste</h1>
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

      {/* Add item input */}
      <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 rounded-xl bg-background px-3 py-2.5">
          <SearchIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Artikel hinzufügen..."
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <input
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Menge"
            className="w-16 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            onClick={handleAdd}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition active:scale-90"
            aria-label="Hinzufügen"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Category chips */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition active:scale-95 ${
                selectedCat === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground"
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
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
            Deine Liste ist leer.<br />Füge oben Artikel hinzu!
          </p>
        </div>
      )}

      <div className="space-y-6">
        {grouped.map(([catId, catItems]) => {
          const cat = getCategory(catId);
          return (
            <div key={catId}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-base">{cat.emoji}</span>
                <h2 className="text-sm font-semibold text-foreground">{cat.label}</h2>
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
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-medium ${item.checked ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {item.name}
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
