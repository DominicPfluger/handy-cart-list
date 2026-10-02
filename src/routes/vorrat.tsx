// ============= Vorrat (Pantry) =============
import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCatalog } from "@/lib/catalog-query";
import { getUnits } from "@/lib/units";
import { useT } from "@/i18n";
import { usePantry } from "@/hooks/use-pantry";
import { useAuthUser } from "@/hooks/use-auth-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductEmoji } from "@/components/product-emoji";
import { ProductIcon } from "@/components/catalog-icon";
import { useIconSet } from "@/hooks/use-icon-set";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/vorrat")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Shoppi — Vorrat" },
      { name: "description", content: "Verwalte, was zuhause da ist." },
      { property: "og:title", content: "Shoppi — Vorrat" },
      { property: "og:description", content: "Verwalte, was zuhause da ist." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VorratPage,
});

function Avatar({ emoji, imageUrl, iconUrl, size = 34 }: { emoji?: string | null | undefined; imageUrl?: string | null | undefined; iconUrl?: string | null; size?: number }) {
  const mode = useIconSet();
  if (mode === "images" && (iconUrl || imageUrl)) {
    return (
      <img
        src={iconUrl || imageUrl || undefined}
        alt=""
        className="shrink-0 object-contain"
        style={{ width: size, height: size }}
        loading="lazy"
      />
    );
  }
  return <ProductEmoji emoji={emoji} fallback="📦" className="shrink-0 text-2xl leading-none" />;
}

function VorratPage() {
  const { t, locale } = useT();
  const user = useAuthUser();
  const pantry = usePantry();
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const catalog = useCatalog();

  const q = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (q.length < 2) return [];
    return catalog.products
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 24);
  }, [catalog, q]);

  const unitLabel = (unitId?: string | undefined) => {
    if (!unitId) return "";
    return getUnits(locale).find((u) => u.id === unitId)?.short ?? "";
  };

  const finishAdd = () => {
    toast.success(t("pantry.added"));
    setQuery("");
    setTimeout(() => setAdding(false), 400);
  };

  const addProduct = (p: (typeof catalog.products)[number]) => {
    if (adding) return;
    setAdding(true);
    pantry.add({
      productId: p.id,
      name: p.name,
      quantity: String(p.defaultQuantity),
      unit: p.defaultUnit,
      organic: false,
      emoji: p.emoji,
      imageUrl: p.imageUrl,
    });
    finishAdd();
  };

  const addCustom = () => {
    const name = query.trim();
    if (!name || adding) return;
    setAdding(true);
    pantry.add({ name, quantity: "1", unit: "stueck" });
    finishAdd();
  };

  return (
    <div className="space-y-5">
      <div>
        <Link to="/" className="text-sm text-primary underline-offset-2 hover:underline">
          ← {t("common.back")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">{t("pantry.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("pantry.desc")}</p>
        {!user && pantry.hydrated && (
          <p className="mt-1 text-xs text-muted-foreground">{t("pantry.localOnly")}</p>
        )}
      </div>

      <section className="space-y-2">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("pantry.searchPlaceholder")}
          className="h-11 rounded-xl bg-card"
        />
        {q.length >= 2 && (
          <ul className="divide-y overflow-hidden rounded-2xl border border-border bg-card">
            {matches.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-3 py-2">
                <Avatar emoji={p.emoji} iconUrl={p.iconUrl} imageUrl={p.imageUrl} />
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{p.name}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg"
                  onClick={() => addProduct(p)}
                  disabled={adding}
                >
                  +
                </Button>
              </li>
            ))}
            {matches.length === 0 ? (
              <li className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="text-sm text-muted-foreground">{t("pantry.noMatch")}</span>
                <Button type="button" variant="outline" size="sm" className="h-8 rounded-lg" onClick={addCustom} disabled={adding}>
                  {t("pantry.addCustom")}
                </Button>
              </li>
            ) : (
              <li>
                <button
                  type="button"
                  onClick={addCustom}
                  disabled={adding}
                  className="w-full px-3 py-2 text-left text-sm text-primary underline-offset-2 hover:underline"
                >
                  {t("pantry.addCustomNamed", { name: query.trim() })}
                </button>
              </li>
            )}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          {t("pantry.items", { n: pantry.items.length })}
        </h2>
        {pantry.hydrated && pantry.items.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
            {t("pantry.empty")}
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {pantry.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-3 py-2">
                <Avatar emoji={item.emoji} imageUrl={item.imageUrl} size={30} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.name}
                    {item.organic ? ` · ${t("pantry.organicSuffix")}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Input
                    inputMode="decimal"
                    defaultValue={item.quantity}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v && v !== item.quantity) pantry.updateQuantity(item.id, v);
                    }}
                    className="h-8 w-16 rounded-lg text-center text-sm"
                  />
                  <span className="w-8 text-xs text-muted-foreground">{unitLabel(item.unit)}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => pantry.remove(item.id)}
                  aria-label={t("pantry.remove")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
