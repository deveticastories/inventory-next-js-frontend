/**
 * Backend (inventory-node-backend) server and every REST endpoint the app calls.
 * The browser calls `BASE_URL` on the same origin; the rewrite in `next.config.ts`
 * forwards `/api/*` to `BACKEND_URL`, so the HTTPS site never makes an HTTP request.
 */
export const BACKEND_URL = "http://3.107.18.59:4005";
// export const BACKEND_URL = "http://localhost:3001";
export const BASE_URL = "/api";

/** Backend caps `limit` at 100 per page. */
export const MAX_PAGE_LIMIT = 100;

export const STORAGE_KEYS = {
  token: "stocklink_token",
  user: "stocklink_user",
} as const;

export const ENDPOINTS = {
  auth: {
    login: "/auth/login",
  },
  users: {
    root: "/users",
    byId: (id: string) => `/users/${id}`,
    status: (id: string) => `/users/${id}/status`,
  },
  vendors: {
    root: "/vendors",
    byId: (id: string) => `/vendors/${id}`,
    details: (id: string) => `/vendors/${id}/details`,
  },
  stores: {
    root: "/stores",
    byId: (id: string) => `/stores/${id}`,
  },
  customers: {
    root: "/customers",
    byId: (id: string) => `/customers/${id}`,
    statement: (id: string) => `/customers/${id}/statement`,
  },
  purchaseEntries: {
    root: "/purchase-entries",
    byId: (id: string) => `/purchase-entries/${id}`,
    qc: (id: string) => `/purchase-entries/${id}/qc`,
  },
  qualityChecks: {
    root: "/purchase-quality-checks",
    byId: (id: string) => `/purchase-quality-checks/${id}`,
    byPurchaseEntry: (purchaseEntryId: string) =>
      `/purchase-quality-checks/purchase-entry/${purchaseEntryId}`,
  },
  indStore: {
    root: "/indian-store-stock-transfers",
    mainStock: "/indian-store-stock-transfers/main-stock",
    sampleStock: "/indian-store-stock-transfers/sample-stock",
    products: "/indian-store-stock-transfers/products",
    byId: (id: string) => `/indian-store-stock-transfers/${id}`,
  },
  dailyExpenses: {
    root: "/daily-expenses",
    byId: (id: string) => `/daily-expenses/${id}`,
    packing: (id: string) => `/daily-expenses/${id}/packing`,
  },
  packingLists: {
    root: "/packing-lists",
    availableStock: "/packing-lists/available-stock",
    updateStatus: "/packing-lists/update-status",
    byId: (id: string) => `/packing-lists/${id}`,
    transit: (id: string) => `/packing-lists/${id}/transit`,
    transferToUae: (id: string) => `/packing-lists/${id}/transfer-to-uae`,
  },
  uaeStore: {
    root: "/uae-store-stock-transfers",
    mainStock: "/uae-store-stock-transfers/main-stock",
    returnStock: "/uae-store-stock-transfers/return-stock",
    returnable: (invoiceId: string) =>
      `/uae-store-stock-transfers/returnable/${invoiceId}`,
    moveToMain: "/uae-store-stock-transfers/move-to-main",
    byId: (id: string) => `/uae-store-stock-transfers/${id}`,
  },
  billings: {
    root: "/billings",
    byId: (id: string) => `/billings/${id}`,
    paymentStatus: (id: string) => `/billings/${id}/payment-status`,
  },
  paymentEntries: {
    root: "/payment-entries",
    payableInvoices: "/payment-entries/payable-invoices",
    byPurchase: (purchaseInvoice: string) =>
      `/payment-entries/purchase/${purchaseInvoice}`,
    byId: (id: string) => `/payment-entries/${id}`,
  },
  receiptEntries: {
    root: "/receipt-entries",
    receivableInvoices: "/receipt-entries/receivable-invoices",
    byInvoice: (invoiceId: string) => `/receipt-entries/invoice/${invoiceId}`,
    byId: (id: string) => `/receipt-entries/${id}`,
  },
  reports: {
    dashboard: "/reports/dashboard",
    purchase: "/reports/purchase-entry",
    sales: "/reports/sales",
    debit: "/reports/debit",
    transit: "/reports/transit",
    indStock: "/reports/ind-stock",
    uaeStock: "/reports/uae-stock",
    sampleStock: "/reports/sample-stock",
    credit: "/reports/credit",
    damage: "/reports/damage",
    return: "/reports/return",
  },
  settings: {
    root: "/settings",
  },
} as const;
