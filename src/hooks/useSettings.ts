"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getSettings } from "@/services/SettingsServices";
import type { Settings } from "@/types";

/* Transit rates are shown in the top bar and edited on Transit — share one copy. */
let current: Settings | null = null;
let loading = false;
const listeners = new Set<() => void>();

export const setSettings = (s: Settings) => {
  current = s;
  listeners.forEach((l) => l());
};

export function refreshSettings() {
  if (loading) return;
  loading = true;
  getSettings()
    .then(setSettings)
    .catch(() => {})
    .finally(() => (loading = false));
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};

export function useSettings(enabled = true) {
  const s = useSyncExternalStore(subscribe, () => current, () => null);
  useEffect(() => {
    if (enabled && !current) refreshSettings();
  }, [enabled]);
  return s;
}
