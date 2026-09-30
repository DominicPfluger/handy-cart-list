// ============= Per Einladungscode einer Liste beitreten =============
import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { joinCloudByCode } from "@/lib/lists.functions";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useT } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PENDING_JOIN_KEY = "shoppi:pending-join";

const searchSchema = z.object({
  code: z.string().optional(),
});

export const Route = createFileRoute("/beitreten")({
  head: () => ({ meta: [{ title: "Einkaufsliste beitreten – Shoppi" }] }),
  validateSearch: searchSchema,
  component: BeitretenPage,
});

function BeitretenPage() {
  const t = useT();
  const user = useAuthUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const code = Route.useSearch().code;
  const [manual, setManual] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const join = async (joinCode: string) => {
    setBusy(true);
    setError(false);
    try {
      const res = await joinCloudByCode({ data: { code: joinCode.trim() } });
      if (res.ok) {
        toast.success(t("join.okList", { name: res.listName }));
        localStorage.removeItem(PENDING_JOIN_KEY);
        await queryClient.invalidateQueries();
        navigate({ to: "/" });
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const normalized = (code ?? "").trim();
  const effectiveCode = normalized.length >= 6 ? normalized : manual.trim();

  useEffect(() => {
    if (!user || busy) return;
    if (effectiveCode) {
      void join(effectiveCode);
    } else if (normalized) {
      // Code-Format ungültig
      setError(true);
      localStorage.setItem(PENDING_JOIN_KEY, normalized);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, normalized, effectiveCode]);

  // Ausstehenden Code merken, bis angemeldet
  useEffect(() => {
    if (!user && normalized) {
      try {
        localStorage.setItem(PENDING_JOIN_KEY, normalized);
      } catch {
        /* ignore */
      }
    }
  }, [user, normalized]);

  return (
    <div className="space-y-5">
      <div>
        <Link to="/" className="text-sm text-primary underline-offset-2 hover:underline">
          ← {t("common.back")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">{t("join.title")}</h1>
      </div>
      <section className="mx-auto max-w-md px-4 pt-8">
        {!user ? (
          <div className="space-y-4 rounded-2xl border bg-card p-5 text-center">
            <p className="text-sm text-muted-foreground">
              {normalized
                ? t("join.signInFirst")
                : t("join.signInFirstManual")}
            </p>
            <Button asChild className="w-full rounded-xl">
              <a href="/auth">{t("join.signInNow")}</a>
            </Button>
          </div>
        ) : busy ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("join.joining")}</p>
        ) : (
          <div className="space-y-3 rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{t("join.enterCode")}</p>
            <Input
              type="text"
              value={manual}
              onChange={(e) => setManual(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter" && manual.trim().length >= 6) void join(manual);
              }}
              placeholder="A1B2C3"
              maxLength={12}
              className="h-11 rounded-xl bg-background text-center text-lg tracking-widest"
            />
            {error && <p className="text-sm text-destructive">{t("join.error")}</p>}
            <Button
              type="button"
              className="w-full rounded-xl"
              disabled={manual.trim().length < 6 || busy}
              onClick={() => void join(manual)}
            >
              {t("join.join")}
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}
