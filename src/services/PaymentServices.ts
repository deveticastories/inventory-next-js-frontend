import { ENDPOINTS } from "@/constants/ApiConstants";
import type { PayableInvoice, PaymentEntry } from "@/types";
import { api, getAllPages, getData } from "./ApiClient";

export type PaymentFilter = "all" | "paid" | "outstanding";

export const getAllPayments = (status: PaymentFilter = "all", sortBy: "date" | "vendor" = "date") =>
  getAllPages<PaymentEntry>(ENDPOINTS.paymentEntries.root, { status, sortBy });

/** QC-approved purchase invoices that still have a balance. */
export const getPayableInvoices = () => getData<PayableInvoice[]>(ENDPOINTS.paymentEntries.payableInvoices);

export const createPayment = async (input: { purchaseInvoice: string; paidAmount: number }) =>
  (await api.post<{ data: PaymentEntry }>(ENDPOINTS.paymentEntries.root, input)).data;

export const deletePayment = (id: string) => api.delete(ENDPOINTS.paymentEntries.byId(id));
