export const nf = (n: number) =>
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** Indian rupee amount. */
export const inr = (n: number) => "₹ " + nf(n);

/** UAE dirham amount. */
export const aed = (n: number) => "AED " + nf(n);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const localDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** API date-time → local YYYY-MM-DD ("" when missing). */
export const isoDay = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso.slice(0, 10) : localDay(d);
};

/** 2026-10-25 (or a full ISO date-time) → 25 Oct 2026. */
export const fmtDate = (iso?: string | null) => {
  const day = isoDay(iso);
  if (!day) return "—";
  const [y, m, d] = day.split("-");
  return `${d} ${MONTHS[+m! - 1] ?? m} ${y}`;
};

export const today = () => localDay(new Date());

/** Newest first by an ISO date field. */
export const byDateDesc = (a?: string | null, b?: string | null) => isoDay(b).localeCompare(isoDay(a));

/** Next running number after the highest existing one, e.g. PK-0003 → PK-0004. */
export const nextCode = (prefix: string, codes: (string | undefined)[]) => {
  const max = codes.reduce((m, c) => {
    const n = c?.startsWith(prefix) ? parseInt(c.slice(prefix.length), 10) : NaN;
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return prefix + String(max + 1).padStart(4, "0");
};

/** Amounts within half a unit count as settled (same tolerance as the backend). */
export const BAL_EPS = 0.5;

export const sum = <T,>(a: T[], f: (x: T) => number) => a.reduce((s, x) => s + f(x), 0);

export const num = (v: string | number) => parseFloat(String(v)) || 0;

/** Case-insensitive "contains" across several fields; empty query matches all. */
export const hit = (q: string, ...fields: (string | number)[]) =>
  !q || fields.some((x) => String(x).toLowerCase().includes(q.toLowerCase()));

export const initials = (name?: string | null) =>
  (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
