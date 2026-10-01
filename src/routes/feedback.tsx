import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLocale, useT } from "../i18n";
import { Button } from "@/components/ui/button";
import { FEEDBACK_SUBJECTS, feedbackSchema, type FeedbackSubject } from "../lib/feedback";

export const Route = createFileRoute("/feedback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Shoppi — Feedback senden" },
      { name: "description", content: "Schick dem Shoppi-Team Feedback, Fehlermeldungen oder Ideen." },
      { property: "og:title", content: "Shoppi — Feedback senden" },
      { property: "og:description", content: "Feedback, Fehlermeldungen oder Ideen direkt aus der App senden." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FeedbackPage,
});

const field = "w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary";

function FeedbackPage() {
  const { t } = useT();
  const [locale] = useLocale();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState<FeedbackSubject>("general");
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return;
      setUserId(u.id);
      setEmail((e) => e || u.email || "");
      const n = (u.user_metadata?.["full_name"] ?? u.user_metadata?.["name"]) as string | undefined;
      if (n) setName((x) => x || n);
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = feedbackSchema.safeParse({ name, email, subject, message });
    if (!parsed.success) { toast.error(t("fb.invalid")); return; }
    setBusy(true);
    const { error } = await supabase.from("feedback_messages").insert({ ...parsed.data, user_id: userId, locale });
    setBusy(false);
    if (error) { toast.error(t("fb.error")); return; }
    toast.success(t("fb.sent"));
    setSent(true);
    setMessage("");
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <Link to="/mehr" className="inline-flex items-center gap-1 text-sm font-medium text-primary">← {t("nav.more")}</Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("fb.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("fb.sub")}</p>
      </div>
      {sent ? (
        <div className="space-y-4 rounded-2xl bg-primary-soft/50 p-5 text-center">
          <p className="text-sm font-medium text-foreground">{t("fb.sent")}</p>
          <Button variant="outline" onClick={() => setSent(false)}>{t("fb.title")}</Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-foreground">{t("fb.name")}</span>
            <input className={field} value={name} maxLength={100} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-foreground">{t("fb.email")}</span>
            <input type="email" className={field} value={email} maxLength={255} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <div className="space-y-2">
            <span className="text-sm font-medium text-foreground">{t("fb.subject")}</span>
            <div className="flex flex-wrap gap-2">
              {FEEDBACK_SUBJECTS.map((s) => (
                <button
                  type="button"
                  key={s.key}
                  onClick={() => setSubject(s.key)}
                  aria-pressed={subject === s.key}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${subject === s.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"}`}
                >
                  {t(s.label)}
                </button>
              ))}
            </div>
          </div>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-foreground">{t("fb.message")}</span>
            <textarea className={`${field} min-h-36`} value={message} maxLength={2000} onChange={(e) => setMessage(e.target.value)} required />
            <span className="block text-right text-xs text-muted-foreground">{message.length}/2000</span>
          </label>
          <Button type="submit" disabled={busy} className="w-full rounded-2xl py-6 text-base">{t("fb.send")}</Button>
        </form>
      )}
    </div>
  );
}
