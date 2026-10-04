import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { checkAdmin } from "../lib/admin.functions";

/** true, wenn der angemeldete Nutzer Admin ist (sonst false, auch ohne Anmeldung). */
export function useIsAdmin(): boolean {
  const check = useServerFn(checkAdmin);
  // Erst prüfen, wenn eine Sitzung besteht — sonst schlägt der Aufruf ohne Token fehl
  // und bliebe wegen retry:false dauerhaft auf false hängen.
  const [sessionReady, setSessionReady] = useState(false);
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setSessionReady(Boolean(session)));
    void supabase.auth.getSession().then(({ data }) => setSessionReady(Boolean(data.session)));
    return () => sub.subscription.unsubscribe();
  }, []);
  const { data } = useQuery({
    queryKey: ["is-admin"],
    enabled: sessionReady,
    queryFn: async () => {
      try {
        return (await check()).isAdmin;
      } catch {
        return false;
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
  return Boolean(data);
}
