import { useMemo, useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useT } from "../i18n";
import type { MessageKey } from "../i18n/de";
import { useRecipeTemplates, templateLabel } from "../lib/use-recipe-templates";
import { RecipePhoto } from "../components/recipe-photo";
import { setRecipeImage, uploadRecipeImage } from "../lib/recipe-images";
import { useAuthUser } from "../hooks/use-auth-user";
import { refreshCollections } from "../hooks/use-saved-recipes";
import {
  fetchCommunity, fetchMyRecipes, publishRecipe, shareLink, unpublishRecipe, type CommunityRecipe,
} from "../lib/recipes-api";

export function CommunitySection() {
  const { t } = useT();
  const { tab, author, name } = useSearch({ from: "/rezepte/inspirationen" });
  const navigate = useNavigate({ from: "/rezepte/inspirationen" });
  const user = useAuthUser();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const mine = tab === "mine";

  const all = useQuery({ queryKey: ["community", author], queryFn: () => fetchCommunity(author || undefined), enabled: !mine });
  const my = useQuery({ queryKey: ["community-mine", user?.id], queryFn: () => fetchMyRecipes(user!.id), enabled: mine && !!user });
  const list = (mine ? my.data : all.data) ?? [];
  const loading = mine ? my.isLoading && !!user : all.isLoading;

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return list.filter((r) => (!cat || r.template_id === cat) && (!s
      || r.title.toLowerCase().includes(s)
      || (r.author_name ?? "").toLowerCase().includes(s)
      || r.items.some((i) => i.name?.toLowerCase().includes(s))));
  }, [list, q, cat]);

  const setTab = (v: string) => navigate({ search: { tab: v, author: "", name: "" } });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1" role="tablist">
        {(["all", "mine"] as const).map((v) => (
          <button key={v} role="tab" aria-selected={tab === v} onClick={() => setTab(v)}
            className={`rounded-lg py-2 text-sm font-semibold ${tab === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
            {t(v === "all" ? "cm.tabAll" : "cm.tabMine")}
          </button>
        ))}
      </div>

      {author && !mine && (
        <div className="flex items-center justify-between rounded-xl bg-accent px-3 py-2 text-sm">
          <span className="font-semibold text-foreground">👤 {t("cm.byAuthor", { name: name || t("cm.anon") })}</span>
          <button onClick={() => setTab("all")} className="text-xs font-semibold text-primary">{t("cm.showAll")}</button>
        </div>
      )}

      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("cm.search")} aria-label={t("cm.search")}
        className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary" />

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <Chip active={!cat} onClick={() => setCat(null)}>{t("cm.allCats")}</Chip>
        {templates.map((tp) => (
          <Chip key={tp.id} active={cat === tp.id} onClick={() => setCat(cat === tp.id ? null : tp.id)}>
            {tp.emoji} {templateLabel(tp, t)}
          </Chip>
        ))}
      </div>

      {mine && user === null ? (
        <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground">{t("cm.signIn")}</p>
      ) : loading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl bg-card p-4 text-center text-sm text-muted-foreground">{mine && list.length === 0 ? t("cm.mineEmpty") : t("cm.empty")}</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => <Card key={r.id} r={r} mine={mine} />)}
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"}`}>
      {children}
    </button>
  );
}

function Card({ r, mine }: { r: CommunityRecipe; mine: boolean }) {
  const { t, locale } = useT();
  const qc = useQueryClient();
  const templates = useRecipeTemplates();
  const [busy, setBusy] = useState(false);
  const tpl = templates.find((x) => x.id === r.template_id);
  const date = new Date(r.created_at).toLocaleDateString(locale);

  const toggle = async () => {
    setBusy(true);
    try {
      if (r.is_public) { await unpublishRecipe(r.id); toast(t("cm.unpublished")); }
      else {
        const slug = await publishRecipe(r.id);
        toast.success(t("cm.published"));
        if ((await shareLink(slug, r.title)) === "copied") toast.success(t("rs.linkCopied"));
      }
      await qc.invalidateQueries({ queryKey: ["community-mine"] });
      await qc.invalidateQueries({ queryKey: ["community"] });
      await qc.invalidateQueries({ queryKey: ["recipe-feed"] });
      void refreshCollections();
    } catch { toast.error(t("cloud.error")); }
    setBusy(false);
  };

  const photo = async (f: File) => {
    setBusy(true);
    try {
      await setRecipeImage(r.id, await uploadRecipeImage(r.owner_id, f));
      await qc.invalidateQueries({ queryKey: ["community-mine"] });
      await qc.invalidateQueries({ queryKey: ["community"] });
      await qc.invalidateQueries({ queryKey: ["recipe-feed"] });
    } catch { toast.error(t("cloud.error")); }
    setBusy(false);
  };

  const body = (
    <>
      <RecipePhoto path={r.image_path} emoji={tpl?.emoji} color={tpl?.color} className="h-16 w-16 shrink-0 rounded-xl" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-foreground">{r.title}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {[r.description, r.items.map((i) => i.name).join(", ")].filter(Boolean).join(" · ")}
        </span>
      </span>
    </>
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <Link to="/rezepte/generator" search={{ cat: undefined, recipe: r.id }} className="flex items-center gap-3">{body}</Link>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        {mine ? (
          <>
            <span>{r.is_public ? `🌍 ${t("cm.isPublic")}` : `🔒 ${t("cm.isPrivate")}`} · {date}</span>
            <label className="cursor-pointer rounded-full bg-muted px-3 py-1 font-semibold text-foreground">
              📷
              <input type="file" accept="image/*" className="sr-only" aria-label={t(r.image_path ? "rk.changePhoto" : "rk.addPhoto")}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void photo(f); e.target.value = ""; }} />
            </label>
            <button disabled={busy} onClick={() => void toggle()}
              className={`rounded-full px-3 py-1 font-semibold ${r.is_public ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"}`}>
              {r.is_public ? t("cm.unpublish") : `🌍 ${t("cm.publish")}`}
            </button>
          </>
        ) : (
          <>
            <Link to="/rezepte/inspirationen" search={{ tab: "all", author: r.owner_id, name: r.author_name ?? "" }} className="font-semibold text-primary">
              👤 {r.author_name || t("cm.anon")}
            </Link>
            <span>{date}</span>
          </>
        )}
      </div>
    </div>
  );
}
