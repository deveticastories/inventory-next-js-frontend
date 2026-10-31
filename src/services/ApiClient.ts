import { BASE_URL, MAX_PAGE_LIMIT } from "@/constants/ApiConstants";
import type { Paged } from "@/types";
import { clearSession, getToken } from "./AuthenticationServices";

type Query = Record<string, string | number | boolean | undefined | null>;

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

/** "PURCHASE_QC_PENDING" → "Purchase qc pending"; plain messages pass through. */
const humanize = (msg: string) =>
  /^[A-Z][A-Z0-9_]+$/.test(msg) ? msg.charAt(0) + msg.slice(1).toLowerCase().replace(/_/g, " ") : msg;

const AUTH_MESSAGES = ["Invalid token", "Token expired", "Unauthorized. Please login"];

const buildUrl = (path: string, query?: Query) => {
  const url = new URL(BASE_URL + path);
  Object.entries(query ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  });
  return url.toString();
};

async function request<T>(method: string, path: string, { query, body }: { query?: Query; body?: unknown } = {}): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers: {
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Cannot reach the server. Check that the backend is running.", 0);
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    const msg = typeof json.message === "string" ? json.message : `Request failed (${res.status})`;
    // verifyToken answers 401 for a missing token and 400 for an expired / bad one
    if (res.status === 401 || AUTH_MESSAGES.includes(msg)) {
      clearSession();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") window.location.replace("/login");
    }
    throw new ApiError(humanize(msg), res.status);
  }
  return json as T;
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>("GET", path, { query }),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, { body }),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, { body }),
  delete: <T>(path: string) => request<T>("DELETE", path),
};

/** Unwraps the `{ success, data }` envelope most endpoints use. */
export const getData = async <T>(path: string, query?: Query) => (await api.get<{ data: T }>(path, query)).data;

/** Walks every page of a paginated list (the backend caps a page at 100 rows). */
export async function getAllPages<T>(path: string, query?: Query): Promise<T[]> {
  const rows: T[] = [];
  for (let page = 1; ; page++) {
    const res = await api.get<Paged<T>>(path, { ...query, page, limit: MAX_PAGE_LIMIT });
    rows.push(...res.data);
    if (!res.pagination?.hasNextPage) return rows;
  }
}

/** Human-readable message for any thrown value. */
export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

/** Record count of a paginated list without fetching its rows. */
export const getTotal = async (path: string) =>
  (await api.get<Paged<unknown>>(path, { page: 1, limit: 1 })).pagination.totalRecords;
