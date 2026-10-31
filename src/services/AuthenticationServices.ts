import { BASE_URL, ENDPOINTS, STORAGE_KEYS } from "@/constants/ApiConstants";
import type { User } from "@/types";

export interface Session {
  token: string;
  user: User;
}

/** Older admin records carry firstName / lastName / role instead of staffName / employeeType. */
type RawUser = Partial<User> & { firstName?: string; lastName?: string; role?: string };
const normalizeUser = (u: RawUser): User => ({
  _id: u._id ?? "",
  staffName: u.staffName || [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || "Staff",
  mobileNumber: u.mobileNumber ?? "",
  employeeId: u.employeeId ?? "",
  email: u.email ?? "",
  employeeType: u.employeeType ?? (u.role === "Biller" || u.role === "Purchaser" ? u.role : "Admin"),
});

/* ---- session kept in localStorage, exposed as a tiny external store ---- */
const listeners = new Set<() => void>();
let cache: Session | null | undefined;

function read(): Session | null {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.token);
    const user = localStorage.getItem(STORAGE_KEYS.user);
    // normalize again: sessions saved by older builds may hold the raw login user
    if (token && user) return { token, user: normalizeUser(JSON.parse(user) as RawUser) };
  } catch {}
  return null;
}

function write(next: Session | null) {
  cache = next;
  try {
    if (next) {
      localStorage.setItem(STORAGE_KEYS.token, next.token);
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(next.user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.token);
      localStorage.removeItem(STORAGE_KEYS.user);
    }
  } catch {}
  listeners.forEach((l) => l());
}

export const subscribeSession = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};
export const getSession = (): Session | null => (cache === undefined ? (cache = read()) : cache);
export const getToken = () => (typeof window === "undefined" ? null : (getSession()?.token ?? null));
export const clearSession = () => write(null);

/* ---- API ---- */

/** POST /auth/login — stores the JWT and the signed-in staff member. */
export async function login(email: string, password: string): Promise<Session> {
  let res: Response;
  try {
    res = await fetch(BASE_URL + ENDPOINTS.auth.login, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
  } catch {
    throw new Error("Cannot reach the server. Check that the backend is running.");
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.token) throw new Error(json.message ?? "Invalid email or password");
  const session = { token: json.token as string, user: normalizeUser(json.user ?? {}) };
  write(session);
  return session;
}

export const logout = () => clearSession();
