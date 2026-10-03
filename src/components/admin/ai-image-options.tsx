import { getLocale, translate } from "@/i18n";
import type { MessageKey } from "@/i18n/de";

const T = (key: MessageKey) => translate(getLocale(), key);

export type AiImageOpts = { style: "photo" | "illustration"; background: "transparent" | "white" | "gradient"; view: "front" | "top" | "side"; count: "single" | "group" };
export const DEFAULT_AI_IMAGE_OPTS: AiImageOpts = { style: "photo", background: "transparent", view: "front", count: "single" };

const FIELDS: Array<{ key: keyof AiImageOpts; label: MessageKey; options: Array<[string, MessageKey]> }> = [
  { key: "style", label: "tile.aiStyle", options: [["photo", "tile.aiStylePhoto"], ["illustration", "tile.aiStyleIllustration"]] },
  { key: "background", label: "tile.aiBackground", options: [["transparent", "tile.aiBgTransparent"], ["white", "tile.aiBgWhite"], ["gradient", "tile.aiBgGradient"]] },
  { key: "view", label: "tile.aiView", options: [["front", "tile.aiViewFront"], ["top", "tile.aiViewTop"], ["side", "tile.aiViewSide"]] },
  { key: "count", label: "tile.aiCount", options: [["single", "tile.aiCountSingle"], ["group", "tile.aiCountGroup"]] },
];

/** Shared AI image option selects (style, background, view, count). */
export function AiImageOptionSelects({ value, onChange }: { value: AiImageOpts; onChange: (next: AiImageOpts) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {FIELDS.map((f) => (
        <label key={f.key} className="space-y-1 text-xs text-muted-foreground">
          <span>{T(f.label)}</span>
          <select value={value[f.key]} onChange={(e) => onChange({ ...value, [f.key]: e.target.value } as AiImageOpts)}
            className="h-9 w-full rounded-xl border border-input bg-background px-2 text-sm text-foreground">
            {f.options.map(([v, k]) => <option key={v} value={v}>{T(k)}</option>)}
          </select>
        </label>
      ))}
    </div>
  );
}
