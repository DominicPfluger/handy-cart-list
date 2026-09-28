import { useEffect, useState } from "react";
import { toast } from "sonner";

export const SHARE_EVENT = "shoppi:share";
export interface SharePayload {
  title: string;
  text: string;
}

export function openShareSheet(payload: SharePayload) {
  window.dispatchEvent(new CustomEvent<SharePayload>(SHARE_EVENT, { detail: payload }));
}

type Target = {
  id: string;
  label: string;
  bg: string;
  letter: string;
  run: (p: SharePayload) => Promise<void> | void;
};

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

async function copyAndOpen(p: SharePayload, url: string, app: string) {
  const ok = await copy(p.text);
  toast.success(
    ok ? `Liste kopiert – in ${app} einfügen` : `${app} wird geöffnet`
  );
  window.open(url, "_blank", "noopener");
}

const TARGETS: Target[] = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    bg: "#25D366",
    letter: "W",
    run: (p) => void window.open(`https://wa.me/?text=${encodeURIComponent(p.text)}`, "_blank", "noopener"),
  },
  {
    id: "telegram",
    label: "Telegram",
    bg: "#229ED9",
    letter: "T",
    run: (p) =>
      void window.open(
        `https://t.me/share/url?url=${encodeURIComponent(" ")}&text=${encodeURIComponent(p.text)}`,
        "_blank",
        "noopener"
      ),
  },
  {
    id: "signal",
    label: "Signal",
    bg: "#3A76F0",
    letter: "S",
    run: async (p) => {
      if (navigator.share) {
        try {
          await navigator.share({ title: p.title, text: p.text });
          return;
        } catch (e) {
          if ((e as Error)?.name === "AbortError") return;
        }
      }
      await copyAndOpen(p, "sgnl://", "Signal");
    },
  },
  {
    id: "messenger",
    label: "Messenger",
    bg: "#0084FF",
    letter: "M",
    run: (p) => {
      const mobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
      return copyAndOpen(p, mobile ? "fb-messenger://" : "https://www.messenger.com/", "Messenger");
    },
  },
  {
    id: "discord",
    label: "Discord",
    bg: "#5865F2",
    letter: "D",
    run: (p) => copyAndOpen(p, "https://discord.com/app", "Discord"),
  },
  {
    id: "email",
    label: "E-Mail",
    bg: "#263238",
    letter: "@",
    run: (p) => {
      window.location.href = `mailto:?subject=${encodeURIComponent(p.title)}&body=${encodeURIComponent(p.text)}`;
    },
  },
];

export function ShareSheet() {
  const [payload, setPayload] = useState<SharePayload | null>(null);

  useEffect(() => {
    const handler = (e: Event) => setPayload((e as CustomEvent<SharePayload>).detail);
    window.addEventListener(SHARE_EVENT, handler);
    return () => window.removeEventListener(SHARE_EVENT, handler);
  }, []);

  if (!payload) return null;
  const close = () => setPayload(null);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40" onClick={close}>
      <div
        role="dialog"
        aria-label="Liste teilen"
        className="w-full max-w-[440px] rounded-t-3xl bg-card p-5 pb-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted" />
        <h2 className="text-lg font-semibold">„{payload.title}" teilen</h2>
        <p className="mb-4 text-sm text-muted-foreground">Wähle einen Dienst</p>
        <div className="grid grid-cols-3 gap-4">
          {TARGETS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={async () => {
                await t.run(payload);
                close();
              }}
              className="flex flex-col items-center gap-2 rounded-2xl p-2 hover:bg-muted"
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-primary-foreground"
                style={{ backgroundColor: t.bg }}
              >
                {t.letter}
              </span>
              <span className="text-xs font-medium">{t.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-2xl border border-border py-3 text-sm font-medium"
            onClick={async () => {
              toast.success((await copy(payload.text)) ? "Liste kopiert" : "Kopieren nicht möglich");
              close();
            }}
          >
            Text kopieren
          </button>
          <button type="button" className="flex-1 rounded-2xl bg-muted py-3 text-sm font-medium" onClick={close}>
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}
