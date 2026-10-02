import { useEffect, useRef, useState } from "react";
import { ProductEmoji } from "./product-emoji";
import { useIconSet } from "../hooks/use-icon-set";
import { cachedCatalogImage } from "../lib/catalog-image-cache";

function CachedImage({ path, signedUrl, className, fallback }: { path?: string | null | undefined; signedUrl?: string | null | undefined; className: string; fallback: React.ReactNode }) {
  const [url, setUrl] = useState<string | null>(null);
  const tried = useRef<string | null>(null);
  useEffect(() => {
    if (!path) return;
    if (tried.current === path && !signedUrl) return;
    tried.current = path;
    let active = true;
    let objectUrl: string | null = null;
    cachedCatalogImage(path, signedUrl).then((result) => {
      if (active) { objectUrl = result; setUrl(result); }
      else URL.revokeObjectURL(result);
    }).catch(() => { if (active) setUrl(null); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); setUrl(null); };
  }, [path, signedUrl]);
  // Keyed remount on path change avoids rendering a previous product's artwork.
  return url ? <img src={url} alt="" loading="lazy" draggable={false} className={className} onError={() => setUrl(null)} /> : <>{fallback}</>;
}

export function ProductIcon({ emoji, iconUrl, iconPath, className = "h-full w-full object-contain", symbolClassName = "text-3xl", fallback = "🛒" }: {
  emoji?: string | null | undefined; iconUrl?: string | null | undefined; iconPath?: string | null | undefined; className?: string; symbolClassName?: string; fallback?: string;
}) {
  const mode = useIconSet();
  return mode === "images" && iconPath
    ? <CachedImage key={iconPath} path={iconPath} signedUrl={iconUrl} className={className} fallback={<ProductEmoji emoji={emoji} fallback={fallback} className={symbolClassName} />} />
    : <ProductEmoji emoji={emoji} fallback={fallback} className={symbolClassName} />;
}

export function DepartmentIcon({ emoji, imageUrl, imagePath, className = "max-h-[74%] max-w-[74%] object-contain", symbolClassName = "text-5xl" }: {
  emoji?: string | null | undefined; imageUrl?: string | null | undefined; imagePath?: string | null | undefined; className?: string; symbolClassName?: string;
}) {
  const mode = useIconSet();
  return mode === "images" && imagePath
    ? <CachedImage key={imagePath} path={imagePath} signedUrl={imageUrl} className={className} fallback={<span aria-hidden="true" className={symbolClassName}>{emoji ?? "🧺"}</span>} />
    : <span aria-hidden="true" className={symbolClassName}>{emoji ?? "🧺"}</span>;
}