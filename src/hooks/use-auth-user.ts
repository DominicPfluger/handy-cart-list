// ============= Aktueller Benutzer (an-/abgemeldet) =============
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AuthUser {
  id: string;
  email?: string | undefined;
  name?: string | undefined;
}

/** undefined = wird noch geprüft, null = abgemeldet, sonst angemeldet. */
// Letzter bekannter Stand: beim Seitenwechsel sofort verfügbar (kein Ladebildschirm).
let lastKnown: AuthUser | null | undefined = undefined;

export function useAuthUser(): AuthUser | null | undefined {
  const [user, setUserState] = useState<AuthUser | null | undefined>(lastKnown);
  const setUser = (u: AuthUser | null) => {
    lastKnown = u;
    setUserState((prev) => (prev && u && prev.id === u.id && prev.email === u.email && prev.name === u.name ? prev : u));
  };

  useEffect(() => {
    let active = true;
    // A stalled session refresh must not hide device-local lists indefinitely.
    const startupTimer = setTimeout(() => {
      if (active) setUser(lastKnown ?? null);
    }, 8000);
    type RawUser = { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null | undefined;
    const toUser = (u: RawUser): AuthUser | null =>
      u
        ? {
            id: u.id,
            email: u.email ?? undefined,
            name:
              (u.user_metadata?.["name"] as string | undefined) ??
              (u.email ? u.email.split("@")[0] : undefined),
          }
        : null;
    const read = async () => {
      // Zuerst gespeicherte Sitzung (funktioniert offline), danach online bestätigen.
      const { data: s } = await supabase.auth.getSession();
      clearTimeout(startupTimer);
      if (!active) return;
      const local = toUser(s.session?.user);
      setUser(local);
      if (!local) return;
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!active) return;
        // Netzwerkfehler: Sitzungsdaten behalten; nur eine echte Abmeldung übernehmen.
        if (error && !data.user) {
          if ((error as { status?: number }).status === 401 || (error as { status?: number }).status === 403) setUser(null);
          return;
        }
        setUser(toUser(data.user));
      } catch {
        /* offline */
      }
    };
    void read().catch(() => { if (active) setUser(lastKnown ?? null); });
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void read().catch(() => { if (active) setUser(lastKnown ?? null); });
    });
    return () => {
      active = false;
      clearTimeout(startupTimer);
      sub.subscription.unsubscribe();
    };
  }, []);

  return user;
}
