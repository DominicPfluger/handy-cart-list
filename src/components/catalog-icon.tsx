import { ProductEmoji } from "./product-emoji";
import { useIconSet } from "../hooks/use-icon-set";

export function ProductIcon({ emoji, iconUrl, className = "h-full w-full object-contain", symbolClassName = "text-3xl", fallback = "🛒" }: {
  emoji?: string | null; iconUrl?: string | null; className?: string; symbolClassName?: string; fallback?: string;
}) {
  const mode = useIconSet();
  return mode === "images" && iconUrl
    ? <img src={iconUrl} alt="" loading="lazy" draggable={false} className={className} />
    : <ProductEmoji emoji={emoji} fallback={fallback} className={symbolClassName} />;
}

export function DepartmentIcon({ emoji, imageUrl, className = "max-h-[74%] max-w-[74%] object-contain", symbolClassName = "text-5xl" }: {
  emoji?: string | null; imageUrl?: string | null; className?: string; symbolClassName?: string;
}) {
  const mode = useIconSet();
  return mode === "images" && imageUrl
    ? <img src={imageUrl} alt="" loading="lazy" draggable={false} className={className} />
    : <span aria-hidden="true" className={symbolClassName}>{emoji ?? "🧺"}</span>;
}