// Webhook für Rezept-Ereignisse: von Datenbank-Triggern (pg_net) aufgerufen.
// 1) recipe_published: öffentliches Rezept → Geräte benachrichtigen, deren
//    Favoritenliste ALLE Zutaten des Rezepts enthält.
// 2) comment_added: Kommentar auf ein Rezept → Geräte des Rezept-Besitzers.
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type PushSub = { user_id: string; device_token: string; locale: string; favorite_product_ids: string[] | null };

type PushTexts = { newFavTitle: string; newFavBody: string; commentTitle: string; commentBody: string };

const PUSH_TEXTS: Record<string, PushTexts> = {
  de: {
    newFavTitle: "🧑‍🍳 Neues Rezept für dich",
    newFavBody: "Alle Zutaten stehen auf deiner Favoritenliste",
    commentTitle: "💬 Neuer Kommentar",
    commentBody: "Jemand hat dein Rezept kommentiert",
  },
  en: {
    newFavTitle: "🧑‍🍳 New recipe for you",
    newFavBody: "All ingredients are on your favorites list",
    commentTitle: "💬 New comment",
    commentBody: "Someone commented on your recipe",
  },
  es: {
    newFavTitle: "🧑‍🍳 Nueva receta para ti",
    newFavBody: "Todos los ingredientes están en tu lista de favoritos",
    commentTitle: "💬 Nuevo comentario",
    commentBody: "Alguien ha comentado tu receta",
  },
  fr: {
    newFavTitle: "🧑‍🍳 Nouvelle recette pour toi",
    newFavBody: "Tous les ingrédients sont dans ta liste de favoris",
    commentTitle: "💬 Nouveau commentaire",
    commentBody: "Quelqu'un a commenté ta recette",
  },
  it: {
    newFavTitle: "🧑‍🍳 Nuova ricetta per te",
    newFavBody: "Tutti gli ingredienti sono nella tua lista dei preferiti",
    commentTitle: "💬 Nuovo commento",
    commentBody: "Qualcuno ha commentato la tua ricetta",
  },
  pt: {
    newFavTitle: "🧑‍🍳 Nova receita para ti",
    newFavBody: "Todos os ingredientes estão na tua lista de favoritos",
    commentTitle: "💬 Novo comentário",
    commentBody: "Alguém comentou a tua receita",
  },
  nl: {
    newFavTitle: "🧑‍🍳 Nieuw recept voor jou",
    newFavBody: "Alle ingrediënten staan op je favorietenlijst",
    commentTitle: "💬 Nieuwe reactie",
    commentBody: "Iemand heeft op je recept gereageerd",
  },
};

function textsFor(locale: string): PushTexts {
  return PUSH_TEXTS[locale.slice(0, 2)] ?? PUSH_TEXTS["de"]!;
}

function adminClient() {
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Push senden — sobald der Push-Dienst verbunden ist (Firebase-Connector),
 *  wird über den Lovable-Gateway verschickt; davor wird nur protokolliert. */
async function sendPush(token: string, locale: string, title: string, body: string, data: Record<string, string>) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const fcmKey = process.env["FIREBASE_MESSAGING_API_KEY"];
  if (!lovableKey || !fcmKey) {
    console.log(`[push:queued] locale=${locale} | ${title} | ${body}`);
    return "skipped" as const;
  }
  try {
    const res = await fetch("https://connector-gateway.lovable.dev/firebase_messaging/v1/projects/_/messages:send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": fcmKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: { token, notification: { title, body }, data } }),
    });
    if (!res.ok) {
      console.error(`[push] FCM ${res.status}: ${(await res.text()).slice(0, 300)}`);
      return "failed" as const;
    }
    return "sent" as const;
  } catch (e) {
    console.error("[push] send failed", e);
    return "failed" as const;
  }
}

export const Route = createFileRoute("/api/public/webhooks/recipe-events")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["RECIPE_EVENTS_SECRET"];
        const given = request.headers.get("x-recipe-events-secret") ?? "";
        if (!secret || given !== secret) return new Response("Unauthorized", { status: 401 });

        const payload = (await request.json().catch(() => null)) as
          | { type?: string; recipe_id?: string; comment_id?: string }
          | null;
        if (
          !payload ||
          !payload.recipe_id ||
          (payload.type !== "recipe_published" && payload.type !== "comment_added")
        ) {
          return new Response("Bad request", { status: 400 });
        }

        const admin = adminClient();
        const { data: recipe } = await admin
          .from("recipes")
          .select("id, title, owner_id, product_ids, is_public")
          .eq("id", payload.recipe_id)
          .maybeSingle();
        if (!recipe || !recipe.is_public) return Response.json({ ok: true, sent: 0 });

        let targets: PushSub[] = [];
        let title = "";
        let bodyText = "";

        if (payload.type === "recipe_published") {
          const { data } = await admin
            .from("push_subscriptions")
            .select("user_id, device_token, locale, favorite_product_ids")
            .eq("notify_new_favorites", true);
          const productIds = (recipe.product_ids ?? []) as string[];
          targets = ((data ?? []) as PushSub[]).filter(
            (s) =>
              s.user_id !== recipe.owner_id &&
              productIds.length > 0 &&
              productIds.every((id) => (s.favorite_product_ids ?? []).includes(id)),
          );
          const t = textsFor(targets[0]?.locale ?? "de");
          title = t.newFavTitle;
          bodyText = `${recipe.title} — ${t.newFavBody}`;
        } else {
          const { data: comment } = await admin
            .from("recipe_comments")
            .select("id, user_id, author_name")
            .eq("id", payload.comment_id ?? "")
            .maybeSingle();
          if (!comment) return Response.json({ ok: true, sent: 0 });
          const { data } = await admin
            .from("push_subscriptions")
            .select("user_id, device_token, locale, favorite_product_ids")
            .eq("user_id", recipe.owner_id)
            .eq("notify_comments", true);
          // Geräte des Kommentierenden auf demselben Konto ausnehmen
          targets = ((data ?? []) as PushSub[]).filter((s) => s.user_id !== comment.user_id);
          const t = textsFor(targets[0]?.locale ?? "de");
          title = t.commentTitle;
          bodyText = `${comment.author_name ? `${comment.author_name}: ` : ""}${recipe.title} — ${t.commentBody}`;
        }

        let sent = 0;
        for (const sub of targets) {
          const result = await sendPush(sub.device_token, sub.locale, title, bodyText, {
            type: payload.type,
            recipe_id: recipe.id,
          });
          if (result === "sent") sent += 1;
        }
        return Response.json({ ok: true, matched: targets.length, sent });
      },
    },
  },
});
