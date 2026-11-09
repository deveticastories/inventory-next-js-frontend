import { ENDPOINTS } from "@/constants/ApiConstants";
import type { ReceiptEntry, ReceivableInvoice } from "@/types";
import { api, getAllPages, getData } from "./ApiClient";

export type ReceiptFilter = "all" | "paid" | "outstanding";

export const getAllReceipts = (status: ReceiptFilter = "all", sortBy: "date" | "customer" = "date") =>
  getAllPages<ReceiptEntry>(ENDPOINTS.receiptEntries.root, { status, sortBy });

/** Customer invoices that still have a balance. */
export const getReceivableInvoices = () => getData<ReceivableInvoice[]>(ENDPOINTS.receiptEntries.receivableInvoices);

export const createReceipt = async (input: { invoice: string; receivedAmount: number; receiptDate: string }) =>
  (await api.post<{ data: ReceiptEntry }>(ENDPOINTS.receiptEntries.root, input)).data;

/** Only received amount and paid date can change; balances on the invoice are recalculated. */
export const updateReceipt = async (id: string, input: { receivedAmount?: number; receiptDate?: string }) =>
  (await api.put<{ data: ReceiptEntry }>(ENDPOINTS.receiptEntries.byId(id), input)).data;

export const deleteReceipt = (id: string) => api.delete(ENDPOINTS.receiptEntries.byId(id));
