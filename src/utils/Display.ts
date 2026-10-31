import type { Billing, Customer, PurchaseEntry, Vendor } from "@/types";
import { fmtDate } from "./Format";

/* Populated-or-id references from the API → display names. */
export const vendorName = (v: Vendor | { vendorName: string } | string | null | undefined) =>
  v && typeof v === "object" ? v.vendorName : "—";

/** Staff display name; older admin records only have firstName / lastName / email. */
export const staffName = (u: { staffName?: string; firstName?: string; lastName?: string; email?: string } | string | null | undefined) =>
  u && typeof u === "object" ? u.staffName || [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || "—" : "—";

export const customerName = (c: Customer | { name: string } | string | null | undefined) =>
  c && typeof c === "object" ? c.name : "—";

/** Dropdown options for purchase invoices. */
export const purchaseOptions = (purchases: PurchaseEntry[]) =>
  purchases.map((p) => ({ value: p._id, label: `${p.invoiceNo} — ${vendorName(p.vendor)} (${fmtDate(p.purchaseDate)})` }));

/** Dropdown options for customer invoices. */
export const billingOptions = (bills: Billing[]) =>
  bills.map((b) => ({ value: b._id, label: `${b.invoiceNo} — ${customerName(b.customer)}` }));
