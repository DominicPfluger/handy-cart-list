import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/i18n";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Shoppi — Anmelden" },
      { name: "description", content: "Anmeldung für die Katalogverwaltung von Shoppi." },
      { property: "og:title", content: "Shoppi — Anmelden" },
      { property: "og:description", content: "Anmeldung für die Katalogverwaltung von Shoppi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useT();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) navigate({ to: "/admin" });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  const submit = async () => {
    setBusy(true);
    const { error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth` } });
    setBusy(false);
    if (error) toast.error(error.message);
    else if (mode === "up") toast.success(t("auth.confirmEmail"));
  };

  return (
    <div className="space-y-5 pt-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("auth.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{mode === "in" ? t("auth.signInSub") : t("auth.signUpSub")}</p>
      </div>
      <Button
        variant="outline"
        className="h-11 w-full rounded-xl"
        onClick={() => lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/auth` })}
      >
        {t("auth.google")}
      </Button>
      <div className="space-y-3">
        <Input type="email" placeholder={t("auth.email")} value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" />
        <Input type="password" placeholder={t("auth.password")} value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl" />
        <Button className="h-11 w-full rounded-xl" disabled={busy || !email || password.length < 4} onClick={submit}>
          {mode === "in" ? t("auth.signIn") : t("auth.signUp")}
        </Button>
        <button className="w-full text-center text-sm font-medium text-primary" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? t("auth.toSignUp") : t("auth.toSignIn")}
        </button>
      </div>
    </div>
  );
}
