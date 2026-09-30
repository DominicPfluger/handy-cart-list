// ============= Server-Funktionen für gemeinsame Listen & Vorrat =============
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Die neuen Tabellen sind (noch) nicht Teil der generierten DB-Typen. */
type Row = Record<string, any>;
type Sb = { from: (table: string) => any };

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeInviteCode(len = 8): string {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

const itemSchema = z.object({
  productId: z.string().uuid().nullish(),
  name: z.string().min(1).max(300),
  quantity: z.string().max(80).default(""),
  unit: z.string().max(40).nullish(),
  organic: z.boolean().optional(),
  emoji: z.string().max(16).nullish(),
  imageUrl: z.string().max(500).nullish(),
  groupLabel: z.string().max(120).nullish(),
  groupEmoji: z.string().max(16).nullish(),
  note: z.string().max(500).nullish(),
  addedByName: z.string().max(80).nullish(),
});

// =============== Listen ===============

export const getMyLists = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as unknown as Sb;
    const [listsRes, membersRes] = await Promise.all([
      sb.from("shopping_lists").select("*").order("sort_order"),
      sb.from("list_members").select("list_id, user_id, display_name"),
    ]);
    if (listsRes.error) throw new Error(listsRes.error.message);
    const ids = (listsRes.data ?? []).map((l: Row) => l.id);
    const { data: items } = ids.length
      ? await sb.from("list_items").select("*").in("list_id", ids)
      : { data: [] as Row[] };
    const { data: userData } = await context.supabase.auth.getUser();
    const email = userData?.user?.email ?? "";
    const displayName = String(userData?.user?.user_metadata?.name ?? email.split("@")[0] ?? "Ich").trim();
    return {
      lists: listsRes.data ?? [],
      items: items ?? [],
      members: membersRes.data ?? [],
      selfId: context.userId,
      displayName,
    };
  });

export const createCloudList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        name: z.string().min(1).max(120),
        isTemplate: z.boolean().optional(),
        items: z.array(itemSchema).optional(),
      })
      .parse(data)
  )
  .handler(async ({ context, data }) => {
    const sb = context.supabase as unknown as Sb;
    const { data: list, error } = await sb
      .from("shopping_lists")
      .insert({
        owner_id: context.userId,
        name: data.name,
        is_template: data.isTemplate ?? false,
        invite_code: makeInviteCode(),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    let itemRows: Row[] = [];
    if (data.items?.length) {
      const { data: inserted, error: itemError } = await sb
        .from("list_items")
        .insert(
          data.items.map((it, i) => ({
            list_id: list.id,
            product_id: it.productId ?? null,
            name: it.name,
            quantity: it.quantity ?? "",
            unit: it.unit ?? null,
            organic: it.organic ?? false,
            emoji: it.emoji ?? null,
            image_url: it.imageUrl ?? null,
            group_label: it.groupLabel ?? null,
            group_emoji: it.groupEmoji ?? null,
            note: it.note ?? null,
            added_by: context.userId,
            added_by_name: it.addedByName ?? null,
            sort_order: i,
          }))
        )
        .select();
      if (itemError) throw new Error(itemError.message);
      itemRows = inserted ?? [];
    }
    return { list, items: itemRows };
  });

export const updateCloudList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().min(1).max(120).optional(),
        isTemplate: z.boolean().optional(),
        order: z.array(z.string().uuid()).optional(),
      })
      .parse(data)
  )
  .handler(async ({ context, data }) => {
    const sb = context.supabase as unknown as Sb;
    const patch: Row = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.isTemplate !== undefined) patch.is_template = data.isTemplate;
    if (Object.keys(patch).length > 0) {
      const { error } = await sb.from("shopping_lists").update(patch).eq("id", data.id);
      if (error) throw new Error(error.message);
    }
    if (data.order) {
      const updates = data.order.map((id, index) =>
        sb.from("shopping_lists").update({ sort_order: index * 10 }).eq("id", id)
      );
      const results = await Promise.all(updates);
      for (const r of results) if (r.error) throw new Error(r.error.message);
    }
    return { ok: true };
  });

export const deleteCloudList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const sb = context.supabase as unknown as Sb;
    const { error } = await sb.from("shopping_lists").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addCloudItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ listId: z.string().uuid(), items: z.array(itemSchema).min(1) }).parse(data)
  )
  .handler(async ({ context, data }) => {
    const sb = context.supabase as unknown as Sb;
    const { data: rows, error } = await sb
      .from("list_items")
      .insert(
        data.items.map((it, i) => ({
          list_id: data.listId,
          product_id: it.productId ?? null,
          name: it.name,
          quantity: it.quantity ?? "",
          unit: it.unit ?? null,
          organic: it.organic ?? false,
          emoji: it.emoji ?? null,
          image_url: it.imageUrl ?? null,
          group_label: it.groupLabel ?? null,
          group_emoji: it.groupEmoji ?? null,
          note: it.note ?? null,
          added_by: context.userId,
          added_by_name: it.addedByName ?? null,
          sort_order: i,
        }))
      )
      .select();
    if (error) throw new Error(error.message);
    return { items: rows ?? [] };
  });

export const updateCloudItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        checked: z.boolean().optional(),
        quantity: z.string().max(80).optional(),
        note: z.string().max(500).nullish(),
        checkedByName: z.string().max(80).nullish(),
      })
      .parse(data)
  )
  .handler(async ({ context, data }) => {
    const sb = context.supabase as unknown as Sb;
    const patch: Row = {};
    if (data.checked !== undefined) {
      patch.checked = data.checked;
      patch.checked_by_name = data.checked ? data.checkedByName ?? null : null;
    }
    if (data.quantity !== undefined) patch.quantity = data.quantity;
    if (data.note !== undefined) patch.note = data.note;
    const { error } = await sb.from("list_items").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCloudItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const sb = context.supabase as unknown as Sb;
    const { error } = await sb.from("list_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const clearCloudChecked = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ listId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const sb = context.supabase as unknown as Sb;
    const { error } = await sb.from("list_items").delete().eq("list_id", data.listId).eq("checked", true);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const joinCloudByCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ code: z.string().min(4).max(32) }).parse(data))
  .handler(async ({ context, data }) => {
    const { data: listId, error } = await (context.supabase as any).rpc("join_list_by_invite", {
      _code: data.code,
    });
    if (error) throw new Error(error.message);
    if (!listId) return { ok: false as const };
    const sb = context.supabase as unknown as Sb;
    const { data: list } = await sb.from("shopping_lists").select("name").eq("id", listId).single();
    return { ok: true as const, listId, listName: (list as Row | null)?.name ?? "" };
  });

export const migrateCloudLists = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        lists: z
          .array(
            z.object({
              name: z.string().min(1).max(120),
              isTemplate: z.boolean().optional(),
              items: z.array(itemSchema),
            })
          )
          .max(50),
      })
      .parse(data)
  )
  .handler(async ({ context, data }) => {
    const sb = context.supabase as unknown as Sb;
    let created = 0;
    for (const l of data.lists) {
      const { data: list, error } = await sb
        .from("shopping_lists")
        .insert({
          owner_id: context.userId,
          name: l.name,
          is_template: l.isTemplate ?? false,
          invite_code: makeInviteCode(),
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      if (l.items.length) {
        const { error: itemError } = await sb.from("list_items").insert(
          l.items.map((it, i) => ({
            list_id: list.id,
            product_id: it.productId ?? null,
            name: it.name,
            quantity: it.quantity ?? "",
            unit: it.unit ?? null,
            organic: it.organic ?? false,
            emoji: it.emoji ?? null,
            image_url: it.imageUrl ?? null,
            group_label: it.groupLabel ?? null,
            group_emoji: it.groupEmoji ?? null,
            note: it.note ?? null,
            added_by: context.userId,
            added_by_name: it.addedByName ?? null,
            sort_order: i,
          }))
        );
        if (itemError) throw new Error(itemError.message);
      }
      created++;
    }
    return { created };
  });

export const leaveCloudList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ listId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const sb = context.supabase as unknown as Sb;
    const { error } = await sb
      .from("list_members")
      .delete()
      .eq("list_id", data.listId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =============== Vorrat ===============

const pantryItemSchema = z.object({
  productId: z.string().uuid().nullish(),
  name: z.string().min(1).max(300),
  quantity: z.string().max(80).default(""),
  unit: z.string().max(40).nullish(),
  organic: z.boolean().optional(),
  emoji: z.string().max(16).nullish(),
  imageUrl: z.string().max(500).nullish(),
});

export const getPantry = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as unknown as Sb;
    const { data, error } = await sb.from("pantry_items").select("*").order("created_at");
    if (error) throw new Error(error.message);
    return { items: data ?? [] };
  });

export const setPantryItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => pantryItemSchema.parse(data))
  .handler(async ({ context, data }) => {
    const sb = context.supabase as unknown as Sb;
    if (data.productId) {
      // Bereits im Vorrat? Dann nur Menge aktualisieren.
      const { data: existing } = await sb
        .from("pantry_items")
        .select("id")
        .eq("user_id", context.userId)
        .eq("product_id", data.productId)
        .limit(1);
      if (existing?.length) {
        const { data: row, error } = await sb
          .from("pantry_items")
          .update({ quantity: data.quantity ?? "1" })
          .eq("id", (existing[0] as Row).id)
          .select()
          .single();
        if (error) throw new Error(error.message);
        return { item: row, updated: true };
      }
    }
    const { data: row, error } = await sb
      .from("pantry_items")
      .insert({
        user_id: context.userId,
        product_id: data.productId ?? null,
        name: data.name,
        quantity: data.quantity ?? "1",
        unit: data.unit ?? null,
        organic: data.organic ?? false,
        emoji: data.emoji ?? null,
        image_url: data.imageUrl ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { item: row, updated: false };
  });

export const updatePantryItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), quantity: z.string().max(80) }).parse(data)
  )
  .handler(async ({ context, data }) => {
    const sb = context.supabase as unknown as Sb;
    const { error } = await sb.from("pantry_items").update({ quantity: data.quantity }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePantryItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const sb = context.supabase as unknown as Sb;
    const { error } = await sb.from("pantry_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
