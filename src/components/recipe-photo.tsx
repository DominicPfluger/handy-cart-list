import { useRecipeImageUrl } from "../lib/recipe-images";

/** Rezeptfoto oder – falls keins vorhanden – Vorlagenbild bzw. farbige Kachel mit Kategorie-Emoji. */
export function RecipePhoto({ path, image, emoji, color, className }: { path?: string | null | undefined; image?: string | undefined; emoji?: string | undefined; color?: string | undefined; className: string }) {
  const url = useRecipeImageUrl(path);
  if (url) return <img src={url} alt="" loading="lazy" className={`${className} object-cover`} />;
  if (image) return <img src={image} alt="" loading="lazy" className={`${className} object-cover`} style={{ background: color }} />;
  return (
    <span className={`${className} grid place-items-center text-xl`} style={{ background: color }} aria-hidden="true">
      {emoji ?? "🍽️"}
    </span>
  );
}
