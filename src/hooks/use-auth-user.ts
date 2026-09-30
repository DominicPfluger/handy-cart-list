// ============= Aktueller Benutzer (an-/abgemeldet) =============
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AuthUser {
  id: string;
  email?: string | undefined;
  name?: string | undefined;
}

/** undefined = wird noch geprüft, null = abgemeldet, sonst angemeldet. */
export function useAuthUser(): AuthUser | null | undefined {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    const read = async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      setUser(
        data.user
          ? {
              id: data.user.id,
              email: data.user.email ?? undefined,
              name:
                (data.user.user_metadata?.["name"] as string | undefined) ??
                (data.user.email ? data.user.email.split("@")[0] : undefined),
            }
          : null
      );
    };
    read();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      read();
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return user;
}
