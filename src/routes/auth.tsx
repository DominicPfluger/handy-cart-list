import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    else if (mode === "up") toast.success("Bitte bestätige deine E-Mail-Adresse.");
  };

  return (
    <div className="space-y-5 pt-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Katalog verwalten</h1>
        <p className="mt-1 text-sm text-muted-foreground">{mode === "in" ? "Melde dich an." : "Konto erstellen."}</p>
      </div>
      <Button
        variant="outline"
        className="h-11 w-full rounded-xl"
        onClick={() => lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/auth` })}
      >
        Mit Google anmelden
      </Button>
      <div className="space-y-3">
        <Input type="email" placeholder="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" />
        <Input type="password" placeholder="Passwort" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl" />
        <Button className="h-11 w-full rounded-xl" disabled={busy || !email || password.length < 6} onClick={submit}>
          {mode === "in" ? "Anmelden" : "Registrieren"}
        </Button>
        <button className="w-full text-center text-sm font-medium text-primary" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "Noch kein Konto? Registrieren" : "Schon registriert? Anmelden"}
        </button>
      </div>
    </div>
  );
}
