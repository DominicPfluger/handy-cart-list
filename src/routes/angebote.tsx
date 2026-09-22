import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { HeartIcon, PinIcon } from "../components/icons";

export const Route = createFileRoute("/angebote")({
  head: () => ({
    meta: [
      { title: "Shoppi — Angebote" },
      { name: "description", content: "Aktuelle Angebote und Deals in Supermärkten in deiner Nähe." },
      { property: "og:title", content: "Shoppi — Angebote" },
      { property: "og:description", content: "Aktuelle Angebote und Deals in Supermärkten in deiner Nähe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OffersPage,
});

const OFFERS = [
  { id: 1, name: "Bio Bananen", price: "1,29 €", oldPrice: "1,79 €", store: "REWE", emoji: "🍌", color: "oklch(0.92 0.06 75)" },
  { id: 2, name: "Vollmilch 1L", price: "0,99 €", oldPrice: "1,19 €", store: "ALDI", emoji: "🥛", color: "oklch(0.93 0.04 250)" },
  { id: 3, name: "Tomaten 500g", price: "1,49 €", oldPrice: "2,29 €", store: "Lidl", emoji: "🍅", color: "oklch(0.92 0.06 20)" },
  { id: 4, name: "Baguette", price: "0,79 €", oldPrice: "1,29 €", store: "EDEKA", emoji: "🥖", color: "oklch(0.93 0.05 75)" },
  { id: 5, name: "Joghurt 4er", price: "1,59 €", oldPrice: "2,49 €", store: "REWE", emoji: "🥛", color: "oklch(0.93 0.04 250)" },
  { id: 6, name: "Mineralwasser 6x1,5L", price: "2,99 €", oldPrice: "3,99 €", store: "Lidl", emoji: "💧", color: "oklch(0.93 0.05 230)" },
];

function OffersPage() {
  const [tab, setTab] = useState<"nahe" | "favoriten">("nahe");
  const [favorites, setFavorites] = useState<number[]>([1, 3]);

  const toggleFav = (id: number) =>
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));

  const shown = tab === "favoriten" ? OFFERS.filter((o) => favorites.includes(o.id)) : OFFERS;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Angebote</h1>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <PinIcon className="h-4 w-4" /> Frankfurt am Main · 2 km Umkreis
        </p>
      </div>

      {/* Segmented control */}
      <div className="flex rounded-xl bg-muted p-1">
        <button
          onClick={() => setTab("nahe")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
            tab === "nahe" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          In deiner Nähe
        </button>
        <button
          onClick={() => setTab("favoriten")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
            tab === "favoriten" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          Favoriten
        </button>
      </div>

      {/* Offer grid */}
      <div className="grid grid-cols-2 gap-3">
        {shown.map((o) => (
          <div key={o.id} className="overflow-hidden rounded-2xl border border-border bg-card">
            <div
              className="relative grid h-28 place-items-center text-5xl"
              style={{ background: o.color }}
            >
              {o.emoji}
              <button
                onClick={() => toggleFav(o.id)}
                className={`absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full backdrop-blur-sm transition active:scale-90 ${
                  favorites.includes(o.id) ? "bg-coral text-coral-foreground" : "bg-card/80 text-muted-foreground"
                }`}
                aria-label="Favorit"
              >
                <HeartIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3">
              <h3 className="truncate text-sm font-semibold text-foreground">{o.name}</h3>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-base font-bold text-primary">{o.price}</span>
                <span className="text-xs text-muted-foreground line-through">{o.oldPrice}</span>
              </div>
              <div className="mt-2 inline-block rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {o.store}
              </div>
            </div>
          </div>
        ))}
      </div>

      {shown.length === 0 && (
        <div className="py-16 text-center">
          <div className="text-5xl">💚</div>
          <p className="mt-4 text-sm text-muted-foreground">Noch keine Favoriten markiert.</p>
        </div>
      )}
    </div>
  );
}
