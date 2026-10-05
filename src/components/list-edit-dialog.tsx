import { useEffect, useState } from "react";
import { useT } from "../i18n";
import { storeLabel, useStores } from "../hooks/use-stores";
import { useGroupOrder } from "../hooks/use-group-order";
import type { ShoppingList } from "../hooks/use-shopping-list";

const STORE_EMOJIS = ["🏪", "🛒", "🧺", "🏬", "🥖", "🐄", "🌱"];

interface Props {
  list: ShoppingList | null;
  storeId: string;
  onClose: () => void;
  onSave: (name: string, storeId: string) => void;
}

/** Bearbeitungsdialog einer Einkaufsliste: Name und Markt/Laden. */
export function ListEditDialog({ list, storeId, onClose, onSave }: Props) {
  const { t } = useT();
  const stores = useStores();
  const { addCustomStore } = useGroupOrder();
  const [name, setName] = useState("");
  const [store, setStore] = useState("default");
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreEmoji, setNewStoreEmoji] = useState("");

  useEffect(() => {
    if (list) {
      setName(list.name);
      setStore(storeId);
      setNewStoreName("");
      setNewStoreEmoji("");
    }
  }, [list, storeId]);

  if (!list) return null;

  const addStore = () => {
    const n = newStoreName.trim();
    if (!n) return;
    const id = addCustomStore(n, newStoreEmoji.trim() || undefined);
    setStore(id);
    setNewStoreName("");
    setNewStoreEmoji("");
  };

  const save = () => {
    const n = name.trim();
    if (!n || store === "__new__") return;
    onSave(n, store);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-foreground/30" onClick={onClose}>
      <div
        className="max-h-[85dvh] w-full max-w-[440px] overflow-y-auto rounded-t-3xl bg-background p-5 pb-[calc(2rem+env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">{t("lm.edit")}</h2>
          <button onClick={onClose} className="text-sm font-semibold text-muted-foreground">
            {t("common.cancel")}
          </button>
        </div>

        <div className="space-y-3">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 60))}
            onKeyDown={(e) => e.key === "Enter" && save()}
            onFocus={(e) => e.target.select()}
            maxLength={60}
            aria-label={t("lm.rename")}
            className="w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
          />

          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="shrink-0">{t("store.label")}</span>
            <select
              value={store}
              onChange={(e) => setStore(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary"
            >
              {stores.map((s) => <option key={s.id} value={s.id}>{storeLabel(s)}</option>)}
              <option value="__new__">{t("store.new")}</option>
            </select>
          </label>

          {store === "__new__" && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <input
                  value={newStoreEmoji}
                  onChange={(e) => setNewStoreEmoji(e.target.value)}
                  maxLength={4}
                  aria-label={t("store.icon")}
                  placeholder="🏪"
                  className="w-11 shrink-0 rounded-lg border border-input bg-background px-2 py-1.5 text-center text-sm outline-none focus:border-primary"
                />
                <input
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addStore()}
                  placeholder={t("store.newPlaceholder")}
                  className="min-w-0 flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                />
                <button
                  onClick={addStore}
                  disabled={!newStoreName.trim()}
                  className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {t("store.add")}
                </button>
              </div>
              <div className="flex gap-1">
                {STORE_EMOJIS.map((e) => (
                  <button key={e} type="button" onClick={() => setNewStoreEmoji(e)} className={`grid h-7 w-7 place-items-center rounded-lg border text-sm ${newStoreEmoji === e ? "border-primary bg-primary-soft/60" : "border-border"}`} aria-label={`${t("store.icon")} ${e}`}>{e}</button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={save}
            disabled={!name.trim() || store === "__new__"}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
