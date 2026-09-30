import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { checkAdmin } from "../lib/admin.functions";

/** true, wenn der angemeldete Nutzer Admin ist (sonst false, auch ohne Anmeldung). */
export function useIsAdmin(): boolean {
  const check = useServerFn(checkAdmin);
  const { data } = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) return false;
      return (await check()).isAdmin;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
  return Boolean(data);
}
