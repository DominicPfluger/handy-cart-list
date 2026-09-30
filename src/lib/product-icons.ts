// Mushroom list icons: the brown-mushroom emoji (🍄‍🟫) is a ZWJ sequence that
// renders as TWO glyphs (red fly agaric + brown square) on devices without
// Unicode 15.1 support, and plain 🍄 IS the poisonous fly agaric. Both are
// intercepted at render time and replaced with a single edible-mushroom icon.
export const MUSHROOM_EMOJIS = ["🍄", "🍄‍🟫"] as const;

const MUSHROOM_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 4C15.4 4 4 15.8 4 27.6 4 32.4 7.8 36 12.8 36h38.4c5 0 8.8-3.6 8.8-8.4C60 15.8 48.6 4 32 4Z" fill="#8a5a33"/><ellipse cx="21" cy="15.5" rx="7" ry="4.5" fill="#a5714a"/><path d="M23 36h18l-2.1 17.3A6.6 6.6 0 0 1 32.3 59a6.6 6.6 0 0 1-6.6-5.7Z" fill="#f2e4cf"/></svg>';

/** Single edible brown mushroom as an inline data URI (never expires). */
export const MUSHROOM_ICON = `data:image/svg+xml,${encodeURIComponent(MUSHROOM_SVG)}`;
