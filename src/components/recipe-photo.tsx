import { useRecipeImageUrl } from "../lib/recipe-images";

/** Rezeptfoto oder – falls keins vorhanden – farbige Kachel mit Kategorie-Emoji. */
export function RecipePhoto({ path, emoji, color, className }: { path?: string | null; emoji?: string; color?: string; className: string }) {
  const url = useRecipeImageUrl(path);
  if (url) return <img src={url} alt="" loading="lazy" className={`${className} object-cover`} />;
  return (
    <span className={`${className} grid place-items-center text-xl`} style={{ background: color }} aria-hidden="true">
      {emoji ?? "🍽️"}
    </span>
  );
}
