import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { toast } from "sonner";
import { useShoppingList } from "../hooks/use-shopping-list";
import { useCatalog, type CatalogProduct } from "../lib/catalog-query";
import { formatQuantity } from "../lib/units";
import { useT } from "../i18n";
import { ScanIcon } from "../components/icons";
import { ProductEmoji } from "../components/product-emoji";
import { ProductIcon } from "../components/catalog-icon";

export const Route = createFileRoute("/scanner")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Shoppi — Barcode-Scanner" },
      { name: "description", content: "Produkte per Barcode-Scan zur Einkaufsliste hinzufügen." },
      { property: "og:title", content: "Shoppi — Barcode-Scanner" },
      { property: "og:description", content: "Produkte per Barcode-Scan zur Einkaufsliste hinzufügen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ScannerPage,
});

interface OffProduct {
  name: string;
  brand?: string;
  quantity?: string;
  imageUrl?: string;
}

interface ScoredMatch {
  product: CatalogProduct;
  score: number;
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9äöüß ]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const STOPWORDS = new Set([
  "der", "die", "das", "und", "mit", "von", "aus", "bio", "the", "and", "with",
  "de", "du", "des", "la", "le", "les", "di", "del", "con", "en", "el", "los",
]);

/** Katalogprodukte nach Token-Überlappung mit dem gescannten Produktnamen bewerten. */
function matchCatalog(products: CatalogProduct[], offName: string, brand?: string): ScoredMatch[] {
  const tokens = normalize(`${offName} ${brand ?? ""}`)
    .split(" ")
    .filter((tok) => tok.length > 2 && !STOPWORDS.has(tok));
  if (!tokens.length) return [];
  const scored: ScoredMatch[] = [];
  for (const p of products) {
    const name = normalize(p.name);
    let score = 0;
    for (const tok of tokens) {
      if (name === tok) score += 3;
      else if (name.split(" ").includes(tok)) score += 2;
      else if (name.includes(tok)) score += 1;
    }
    if (score > 0) scored.push({ product: p, score });
  }
  scored.sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name));
  return scored.slice(0, 4);
}

async function lookupBarcode(code: string): Promise<OffProduct | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,product_name_de,generic_name,generic_name_de,brands,quantity,image_front_small_url`,
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status !== 1 || !json.product) return null;
    const p = json.product;
    const name: string =
      p.product_name_de || p.product_name || p.generic_name_de || p.generic_name || "";
    if (!name.trim()) return null;
    return {
      name: name.trim(),
      brand: typeof p.brands === "string" ? p.brands.split(",")[0]?.trim() : undefined,
      quantity: typeof p.quantity === "string" ? p.quantity : undefined,
      imageUrl: typeof p.image_front_small_url === "string" ? p.image_front_small_url : undefined,
    };
  } catch {
    return null;
  }
}

function ScannerPage() {
  const { t } = useT();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("scan.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("scan.subtitle")}</p>
      </div>
      <ClientOnly fallback={<p className="text-sm text-muted-foreground">{t("scan.loading")}</p>}>
        <ScannerView />
      </ClientOnly>
    </div>
  );
}

type Phase =
  | { kind: "scanning" }
  | { kind: "looking-up"; code: string }
  | { kind: "result"; code: string; off: OffProduct | null }
  | { kind: "camera-error" };

function ScannerView() {
  const { t } = useT();
  const data = useCatalog();
  const { addCatalogItem, addItem } = useShoppingList();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "scanning" });
  const [manualCode, setManualCode] = useState("");
  const busyRef = useRef(false);

  const deptById = useMemo(
    () => new Map(data.departments.map((d) => [d.id, d])),
    [data.departments],
  );

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
  }, []);

  const handleCode = useCallback(
    async (code: string) => {
      if (busyRef.current) return;
      busyRef.current = true;
      stopCamera();
      setPhase({ kind: "looking-up", code });
      const off = await lookupBarcode(code);
      setPhase({ kind: "result", code, off });
      busyRef.current = false;
    },
    [stopCamera],
  );

  const startScanner = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const { DecodeHintType, BarcodeFormat } = await import("@zxing/library");
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128,
      ]);
      const reader = new BrowserMultiFormatReader(hints);
      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result) => {
          if (result) handleCode(result.getText());
        },
      );
      controlsRef.current = controls;
      setPhase({ kind: "scanning" });
    } catch {
      setPhase({ kind: "camera-error" });
    }
  }, [handleCode]);

  useEffect(() => {
    startScanner();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rescan = () => {
    setManualCode("");
    startScanner();
  };

  const matches = useMemo(() => {
    if (phase.kind !== "result" || !phase.off) return [];
    return matchCatalog(data.products, phase.off.name, phase.off.brand);
  }, [phase, data.products]);

  const addProduct = (product: CatalogProduct) => {
    const group = product.departmentId ? deptById.get(product.departmentId) : null;
    addCatalogItem({
      productId: product.id,
      name: product.name,
      quantity: formatQuantity(product.defaultQuantity, product.defaultUnit),
      unit: product.defaultUnit,
      organic: false,
      emoji: product.emoji,
      imageUrl: product.imageUrl,
      groupLabel: group?.name,
      groupEmoji: group?.emoji ?? undefined,
    });
    toast.success(t("common.addedToList", { name: product.name }));
    rescan();
  };

  const addFreeText = (name: string) => {
    addItem(name, "1 Stück", "sonstiges");
    toast.success(t("common.addedToList", { name }));
    rescan();
  };

  return (
    <div className="space-y-4">
      {/* Kamera / Suchansicht */}
      {(phase.kind === "scanning" || phase.kind === "looking-up") && (
        <div className="relative overflow-hidden rounded-2xl border border-border bg-foreground/90">
          <video ref={videoRef} className="aspect-[4/3] w-full object-cover" muted playsInline />
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="h-24 w-3/4 rounded-xl border-2 border-primary-foreground/80" />
          </div>
          {phase.kind === "looking-up" && (
            <div className="absolute inset-0 grid place-items-center bg-foreground/60">
              <p className="rounded-full bg-card px-4 py-2 text-sm font-semibold text-foreground">
                {t("scan.searching")}
              </p>
            </div>
          )}
        </div>
      )}
      {phase.kind === "scanning" && (
        <p className="text-center text-sm text-muted-foreground">{t("scan.point")}</p>
      )}

      {phase.kind === "camera-error" && (
        <div className="rounded-2xl border border-border bg-card p-5 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-primary-soft/50 text-primary">
            <ScanIcon className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-foreground">{t("scan.cameraError")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("scan.cameraErrorSub")}</p>
        </div>
      )}

      {/* Ergebnis */}
      {phase.kind === "result" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            {phase.off ? (
              <div className="flex items-center gap-3">
                {phase.off.imageUrl ? (
                  <img
                    src={phase.off.imageUrl}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-xl object-contain"
                  />
                ) : (
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-primary-soft/50 text-primary">
                    <ScanIcon className="h-6 w-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{phase.off.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[phase.off.brand, phase.off.quantity].filter(Boolean).join(" · ") || phase.code}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">{t("scan.notFound")}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("scan.notFoundSub", { code: phase.code })}
                </p>
              </div>
            )}
          </div>

          {matches.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("scan.matchTitle")}
              </p>
              <div className="divide-y divide-border rounded-2xl border border-border bg-card">
                {matches.map(({ product }) => (
                  <button
                    key={product.id}
                    onClick={() => addProduct(product)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition active:bg-muted"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center"><ProductIcon emoji={product.emoji} iconUrl={product.iconUrl} symbolClassName="text-xl" /></span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                      {product.name}
                    </span>
                    <span className="text-xs font-semibold text-primary">{t("scan.add")}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : phase.off ? (
            <button
              onClick={() => addFreeText(phase.off!.name)}
              className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition active:opacity-90"
            >
              {t("scan.addAs", { name: phase.off.name })}
            </button>
          ) : null}

          <button
            onClick={rescan}
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition active:bg-muted"
          >
            {t("scan.rescan")}
          </button>
        </div>
      )}

      {/* Manuelle Code-Eingabe */}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const code = manualCode.trim();
          if (code) handleCode(code);
        }}
      >
        <input
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value.replace(/[^0-9]/g, ""))}
          inputMode="numeric"
          placeholder={t("scan.manualCode")}
          className="min-w-0 flex-1 rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition active:opacity-90"
        >
          {t("scan.lookup")}
        </button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        <Link to="/" className="underline">{t("scan.backToList")}</Link>
      </p>
    </div>
  );
}
