"use client";

import { useSyncExternalStore } from "react";
import { getSession, subscribeSession, type Session } from "@/services/AuthenticationServices";

/**
 * Signed-in session from localStorage.
 * `undefined` on the server / during hydration, `null` when signed out.
 */
export const useSession = (): Session | null | undefined =>
  useSyncExternalStore(subscribeSession, getSession, () => undefined);
