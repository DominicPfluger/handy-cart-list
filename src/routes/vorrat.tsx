// ============= Vorrat (Pantry) =============
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { catalogQueryOptions } from "@/lib/catalog-query";
import { getUnits } from "@/lib/units";
import { useT } from "@/i18n";
import { usePantry } from "@/hooks/use-pantry";
import { useAuthUser } from "@/hooks/use-auth-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BackLink } from "@/components/back-link";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/vorrat")({
  head: () => ({ meta: [{ title: "Vorrat – Shoppi" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions()),
  component: VorratPage,
});

function ProductAvatar({ emoji, imageUrl, size = 36 }: { emoji?: string | null | undefined; imageUrl?: string | null | undefined; size?: number }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        className="shrink-0 object-contain"
        style={{ width: size, height: size }}
        loading="lazy"
      />
    );
  }
  return (
    <span className="shrink-0 text-center leading-none" style={{ width: size, height: size, fontSize: size * 0.62 }}>
      {emoji || "📦"}
    </span>
  );
}

function VorratPage() {
  const t = useT();
  const user = useAuthUser();
  const pantry = usePantry();
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const { data: catalog } = useQuery(catalogQueryOptions());

  const q = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!catalog || q.length < 2) return [];
    return catalog.products
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 24);
  }, [catalog, q]);

  const unitLabel = (unitId?: string | undefined) => {
    if (!unitId) return "";
    return getUnits(t.locale).find((u) => u.id === unitId)?.short ?? "";
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
    toast.success(t("pantry.added"));
    setQuery("");
    setTimeout(() => setAdding(false), 400);
  };

  const addCustom = () => {
    const name = query.trim();
    if (!name || adding) return;
    setAdding(true);
    pantry.add({ name, quantity: "1", unit: "stueck" });
    toast.success(t("pantry.added"));
    setQuery("");
    setTimeout(() => setAdding(false), 400);
  };

  return (
    <main className="min-h-[100dvh] bg-background pb-24">
      <header className="sticky top-0 z-20 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <BackLink />
        <h1 className="text-xl font-bold">{t("pantry.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("pantry.desc")}</p>
        {!user && hydratedNote(pantry.hydrated)}
      </header>

      <section className="px-4 pt-4">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("pantry.searchPlaceholder")}
          className="h-11 rounded-xl bg-card"
        />
        {q.length >= 2 && (
          <ul className="mt-2 divide-y overflow-hidden rounded-xl border bg-card">
            {matches.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-3 py-2">
                <ProductAvatar emoji={p.emoji} imageUrl={p.imageUrl} />
                <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
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
            {matches.length === 0 && (
              <li className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="text-sm text-muted-foreground">{t("pantry.noMatch")}</span>
                <Button type="button" variant="outline" size="sm" className="h-8 rounded-lg" onClick={addCustom} disabled={adding}>
                  {t("pantry.addCustom")}
                </Button>
              </li>
            )}
            {matches.length > 0 && (
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

      <section className="px-4 pt-4">
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
          {t("pantry.items", { n: pantry.items.length })}
        </h2>
        {pantry.hydrated && pantry.items.length === 0 ? (
          <p className="rounded-xl bg-card px-4 py-6 text-center text-sm text-muted-foreground">
            {t("pantry.empty")}
          </p>
        ) : (
          <ul className="divide-y overflow-hidden rounded-xl border bg-card">
            {pantry.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-3 py-2">
                <ProductAvatar emoji={item.emoji} imageUrl={item.imageUrl} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {item.name}
                    {item.organic ? ` ${t("common.organicShort")}` : ""}
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
    </main>
  );
}

function hydratedNote(hydrated: boolean) {
  const { t } = useT();
  if (!hydrated) return null;
  return <p className="mt-1 text-xs text-muted-foreground">{t("pantry.localOnly")}</p>;
}
