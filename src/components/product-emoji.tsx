import { MUSHROOM_EMOJIS, MUSHROOM_ICON } from "@/lib/product-icons";

const MUSHROOM_SET = new Set<string>(MUSHROOM_EMOJIS);

/**
 * Renders a product/list emoji, swapping fly-agaric or two-glyph mushroom
 * emojis for a single edible-mushroom icon.
 */
export function ProductEmoji({
  emoji,
  fallback = "🛒",
  className = "",
}: {
  emoji?: string | null | undefined;
  fallback?: string;
  className?: string;
}) {
  if (emoji && MUSHROOM_SET.has(emoji)) {
    return (
      <span aria-hidden="true" className={`inline-flex items-center justify-center leading-none ${className}`}>
        <img src={MUSHROOM_ICON} alt="" draggable={false} className="h-[1em] w-[1em] object-contain" />
      </span>
    );
  }
  return (
    <span aria-hidden="true" className={className}>
      {emoji ?? fallback}
    </span>
  );
}
