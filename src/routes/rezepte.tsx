import { createFileRoute } from "@tanstack/react-router";
import { LeafIcon } from "../components/icons";

export const Route = createFileRoute("/rezepte")({
  head: () => ({
    meta: [
      { title: "Shoppi — Rezepte" },
      { name: "description", content: "Rezepte entdecken und Zutaten direkt zur Einkaufsliste hinzufügen." },
      { property: "og:title", content: "Shoppi — Rezepte" },
      { property: "og:description", content: "Rezepte entdecken und Zutaten direkt zur Einkaufsliste hinzufügen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RecipesPage,
});

const RECIPES = [
  { id: 1, title: "Pasta Pesto mit Kirschtomaten", time: "20 Min", servings: "4 Pers", emoji: "🍝", badge: "Beliebt", color: "oklch(0.92 0.06 75)" },
  { id: 2, title: "Frischer Büffelmozzarella-Salat", time: "15 Min", servings: "2 Pers", emoji: "🥗", badge: "Saisonal", color: "oklch(0.92 0.06 144)" },
  { id: 3, title: "Fluffige Buttermilch-Pancakes", time: "25 Min", servings: "4 Pers", emoji: "🥞", badge: "Frühstück", color: "oklch(0.92 0.04 75)" },
  { id: 4, title: "Ofengemüse mit Feta", time: "35 Min", servings: "4 Pers", emoji: "🧀", badge: "Vegetarisch", color: "oklch(0.92 0.06 20)" },
  { id: 5, title: "Hähnchen-Curry mit Kokosmilch", time: "30 Min", servings: "4 Pers", emoji: "🍛", badge: "Scharf", color: "oklch(0.92 0.06 50)" },
  { id: 6, title: "Beeren-Smoothie-Bowl", time: "10 Min", servings: "2 Pers", emoji: "🍓", badge: "Vegan", color: "oklch(0.92 0.08 0)" },
];

function RecipesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Rezepte</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Inspiration finden & Zutaten übernehmen
        </p>
      </div>

      {/* Saisonal banner */}
      <div className="flex items-center gap-3 rounded-2xl bg-primary-soft/40 p-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-soft">
          <LeafIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Saisonal im September</p>
          <p className="text-xs text-muted-foreground">Kürbis, Äpfel & Pflaumen sind jetzt besonders frisch</p>
        </div>
      </div>

      <div className="space-y-3">
        {RECIPES.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3 transition active:scale-[0.99]"
          >
            <div
              className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-3xl"
              style={{ background: r.color }}
            >
              {r.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary-soft/60 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {r.badge}
                </span>
              </div>
              <h3 className="mt-1 truncate text-sm font-semibold text-foreground">{r.title}</h3>
              <p className="text-xs text-muted-foreground">⏱ {r.time} · 🍽 {r.servings}</p>
            </div>
            <button className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition active:scale-95">
              Zutaten
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
