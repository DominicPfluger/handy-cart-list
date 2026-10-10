import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/i18n";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { FEEDBACK_SUBJECTS } from "@/lib/feedback";

export const Route = createFileRoute("/_authenticated/feedback-admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Shoppi — Feedback-Posteingang" },
      { name: "description", content: "Alle Feedback-Anfragen der Shoppi-Nutzer verwalten." },
      { property: "og:title", content: "Shoppi — Feedback-Posteingang" },
      { property: "og:description", content: "Alle Feedback-Anfragen der Shoppi-Nutzer verwalten." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FeedbackInbox,
});

export const feedbackQueryKey = ["feedback-messages"];

function FeedbackInbox() {
  const { t } = useT();
  const isAdmin = useIsAdmin();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const { data = [], isLoading } = useQuery({
    queryKey: feedbackQueryKey,
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("feedback_messages").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const label = (key: string) => {
    const s = FEEDBACK_SUBJECTS.find((x) => x.key === key);
    return s ? t(s.label) : key;
  };
  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("feedback_messages").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    qc.invalidateQueries({ queryKey: feedbackQueryKey });
  };
  const remove = async (id: string) => {
    if (!confirm(t("fb.delete") + "?")) return;
    const { error } = await supabase.from("feedback_messages").delete().eq("id", id);
    if (error) toast.error(error.message);
    qc.invalidateQueries({ queryKey: feedbackQueryKey });
  };

  const rows = filter === "all" ? data : data.filter((r) => r.subject === filter);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <Link to="/mehr" className="inline-flex items-center gap-1 text-sm font-medium text-primary">← {t("nav.more")}</Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("fb.inbox")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("fb.inboxSub")}</p>
      </div>
      {!isAdmin ? null : (
        <>
          <div className="flex flex-wrap gap-2 pb-1">
            {[{ key: "all", label: "fb.all" as const }, ...FEEDBACK_SUBJECTS].map((s) => (
              <button key={s.key} onClick={() => setFilter(s.key)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${filter === s.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"}`}>
                {t(s.label)}
              </button>
            ))}
          </div>
          {isLoading ? null : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("fb.empty")}</p>
          ) : (
            <ul className="space-y-3">
              {rows.map((r) => (
                <li key={r.id} className={`space-y-2 rounded-2xl border p-4 ${r.status === "neu" ? "border-primary/40 bg-primary-soft/30" : "border-border bg-card opacity-80"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{label(r.subject)}</p>
                      <p className="truncate text-xs text-muted-foreground">{r.name} · {r.email} · {new Date(r.created_at).toLocaleString()}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${r.status === "neu" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {r.status === "neu" ? t("fb.st.neu") : t("fb.st.erledigt")}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-foreground">{r.message}</p>
                  <div className="flex flex-wrap gap-3 pt-1 text-xs font-medium">
                    <a className="text-primary" href={`mailto:${r.email}?subject=${encodeURIComponent("Re: " + label(r.subject))}`}>{t("fb.reply")}</a>
                    <button className="text-primary" onClick={() => setStatus(r.id, r.status === "neu" ? "erledigt" : "neu")}>
                      {r.status === "neu" ? t("fb.markDone") : t("fb.markNew")}
                    </button>
                    <button className="text-destructive" onClick={() => remove(r.id)}>🗑️ {t("fb.delete")}</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
