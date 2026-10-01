import { useCallback, useEffect, useState } from "react";

const KEY = "shoppi:notification-settings";
const EVENT = "shoppi:notification-settings-changed";

export interface NotificationSettings {
  enabled: boolean;
  listChanges: boolean;
  shoppingTrip: boolean;
  reminders: boolean;
  pantryHistory: boolean;
  newFavoriteRecipes: boolean;
  recipeComments: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  listChanges: true,
  shoppingTrip: true,
  reminders: true,
  pantryHistory: true,
  newFavoriteRecipes: true,
  recipeComments: true,
};

export function getNotificationSettings(): NotificationSettings {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATION_SETTINGS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_NOTIFICATION_SETTINGS;
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

export function setNotificationSettings(next: NotificationSettings) {
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
}

export function useNotificationSettings(): [NotificationSettings, (patch: Partial<NotificationSettings>) => void] {
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings);
  useEffect(() => {
    const sync = () => setSettings(getNotificationSettings());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const update = useCallback((patch: Partial<NotificationSettings>) => {
    const next = { ...getNotificationSettings(), ...patch };
    setNotificationSettings(next);
    setSettings(next);
  }, []);
  return [settings, update];
}
