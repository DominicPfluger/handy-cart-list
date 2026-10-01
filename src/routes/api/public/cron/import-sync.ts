// Geplanter Abgleich gespeicherter Import-Quellen (von pg_cron aufgerufen).
// Schreibt nur Kandidaten (Bestätigung im Admin) und aktualisiert Richtpreise exakter Treffer.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/cron/import-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["IMPORT_CRON_SECRET"];
        if (!secret || request.headers.get("x-import-cron-secret") !== secret) return new Response("Unauthorized", { status: 401 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { scanToCandidates } = await import("@/lib/import.server");
        const { data: sources } = await supabaseAdmin.from("import_sources").select("*").eq("enabled", true);
        const now = Date.now();
        const due = (sources ?? []).filter((s) => {
          if (!s.last_run_at) return true;
          const age = now - new Date(s.last_run_at).getTime();
          return age >= (s.interval === "daily" ? 23 : 24 * 7 - 1) * 3600_000;
        }).slice(0, 3);
        const results = [];
        for (const s of due) {
          let status: string;
          try {
            const r = await scanToCandidates(supabaseAdmin, { url: s.url, market: s.market, sourceId: s.id });
            status = `ok: ${r.found} gefunden, ${r.pending} neu`;
          } catch (e) {
            status = `Fehler: ${(e as Error).message}`.slice(0, 300);
          }
          await supabaseAdmin.from("import_sources").update({ last_run_at: new Date().toISOString(), last_status: status }).eq("id", s.id);
          results.push({ id: s.id, status });
        }
        return Response.json({ ok: true, processed: results });
      },
    },
  },
});
