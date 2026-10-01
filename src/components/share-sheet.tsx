import { useEffect, useState } from "react";
import { toast } from "sonner";
import { siWhatsapp, siTelegram, siSignal, siMessenger, siDiscord, siThreema } from "simple-icons";
import { getLocale, translate, useT } from "../i18n";
import { BrandIcon, MailIcon, SmsIcon } from "./share-icons";

export const SHARE_EVENT = "shoppi:share";
export interface SharePayload {
  title: string;
  text: string;
  /** Eigene Überschrift statt „„{name}“ teilen“ */
  heading?: string;
}

export function openShareSheet(payload: SharePayload) {
  window.dispatchEvent(new CustomEvent<SharePayload>(SHARE_EVENT, { detail: payload }));
}

type Target = {
  id: string;
  label: string;
  bg: string;
  iconPath?: string;
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
    translate(getLocale(), ok ? "share.pasteIn" : "share.opening", { app })
  );
  window.open(url, "_blank", "noopener");
}

const TARGETS: Target[] = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    bg: "#25D366",
    iconPath: siWhatsapp.path,
    run: (p) => void window.open(`https://wa.me/?text=${encodeURIComponent(p.text)}`, "_blank", "noopener"),
  },
  {
    id: "telegram",
    label: "Telegram",
    bg: "#26A5E4",
    iconPath: siTelegram.path,
    run: (p) =>
      void window.open(
        `https://t.me/share/url?url=${encodeURIComponent(" ")}&text=${encodeURIComponent(p.text)}`,
        "_blank",
        "noopener"
      ),
  },
  {
    id: "sms",
    label: "SMS",
    bg: "#546E7A",
    run: (p) => {
      window.location.href = `sms:?&body=${encodeURIComponent(p.text)}`;
    },
  },
  {
    id: "threema",
    label: "Threema",
    bg: "#1F9E9E",
    iconPath: siThreema.path,
    run: (p) => {
      const mobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
      if (mobile) {
        window.location.href = `threema://compose?text=${encodeURIComponent(p.text)}`;
        return;
      }
      return copyAndOpen(p, "https://threema.id/", "Threema");
    },
  },
  {
    id: "signal",
    label: "Signal",
    bg: "#3B45FD",
    iconPath: siSignal.path,
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
    bg: "#0866FF",
    iconPath: siMessenger.path,
    run: (p) => {
      const mobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
      return copyAndOpen(p, mobile ? "fb-messenger://" : "https://www.messenger.com/", "Messenger");
    },
  },
  {
    id: "discord",
    label: "Discord",
    bg: "#5865F2",
    iconPath: siDiscord.path,
    run: (p) => copyAndOpen(p, "https://discord.com/app", "Discord"),
  },
  {
    id: "email",
    label: "E-Mail",
    bg: "#263238",
    run: (p) => {
      window.location.href = `mailto:?subject=${encodeURIComponent(p.title)}&body=${encodeURIComponent(p.text)}`;
    },
  },
];

export function ShareSheet() {
  const { t } = useT();
  const [payload, setPayload] = useState<SharePayload | null>(null);

  useEffect(() => {
    const handler = (e: Event) => setPayload((e as CustomEvent<SharePayload>).detail);
    window.addEventListener(SHARE_EVENT, handler);
    return () => window.removeEventListener(SHARE_EVENT, handler);
  }, []);

  if (!payload) return null;
  const close = () => setPayload(null);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-foreground/40" onClick={close}>
      <div
        role="dialog"
        aria-label={t("list.share")}
        className="max-h-[85dvh] w-full max-w-[440px] overflow-y-auto rounded-t-3xl bg-card p-5 pb-[calc(2rem+env(safe-area-inset-bottom))] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted" />
        <h2 className="text-lg font-semibold">{payload.heading ?? t("share.title", { name: payload.title })}</h2>
        <p className="mb-4 text-sm text-muted-foreground">{t("share.choose")}</p>
        <div className="grid grid-cols-3 gap-4">
          {TARGETS.map((target) => (
            <button
              key={target.id}
              type="button"
              onClick={async () => {
                await target.run(payload);
                close();
              }}
              className="flex flex-col items-center gap-2 rounded-2xl p-2 hover:bg-muted"
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full text-primary-foreground"
                style={{ backgroundColor: target.bg }}
              >
                {target.iconPath ? <BrandIcon path={target.iconPath} /> : target.id === "sms" ? <SmsIcon /> : <MailIcon />}
              </span>
              <span className="text-xs font-medium">{target.id === "email" ? t("share.email") : target.id === "sms" ? t("inv.sms") : target.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-2xl border border-border py-3 text-sm font-medium"
            onClick={async () => {
              toast.success((await copy(payload.text)) ? t("share.copied") : t("share.copyFailed"));
              close();
            }}
          >
            {t("share.copyText")}
          </button>
          <button type="button" className="flex-1 rounded-2xl bg-muted py-3 text-sm font-medium" onClick={close}>
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
