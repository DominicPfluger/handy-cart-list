import { useState } from "react";

export const AVATAR_COLORS = [
  "oklch(0.52 0.155 144)",
  "oklch(0.75 0.16 47)",
  "oklch(0.62 0.18 280)",
  "oklch(0.55 0.13 210)",
];

/**
 * Rundes Profilbild eines Listen-Mitglieds.
 * Prototyping: Platzhalter-Foto (pravatar.cc), stabil pro Name.
 * Fällt bei Ladefehler auf die farbige Initialen-Kachel zurück.
 * Später kann hier die echte avatar_url des Mitglieds übergeben werden.
 */
export function MemberAvatar({
  name,
  index,
  size = 56,
  textClass = "text-lg",
  photoUrl,
}: {
  name: string;
  index: number;
  size?: number;
  textClass?: string;
  photoUrl?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const url = photoUrl ?? `https://i.pravatar.cc/150?u=${encodeURIComponent(name)}`;

  if (failed) {
    return (
      <div
        className={`grid shrink-0 place-items-center rounded-full font-bold text-card ${textClass}`}
        style={{ background: AVATAR_COLORS[index % AVATAR_COLORS.length], width: size, height: size }}
      >
        {name[0]}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={name}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className="shrink-0 rounded-full border-2 border-card object-cover shadow-sm"
      style={{ width: size, height: size }}
    />
  );
}
