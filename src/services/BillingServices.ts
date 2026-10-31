import { ENDPOINTS } from "@/constants/ApiConstants";
import type { Billing } from "@/types";
import { api, getAllPages, getData } from "./ApiClient";

export interface CreateBillingInput {
  date: string;
  customer: string;
  products: { uaeMainStock: string; qty: number; unitPrice: number }[];
}

/** Newest first, customer populated. */
export const getAllBillings = (customer?: string) => getAllPages<Billing>(ENDPOINTS.billings.root, { customer });

export const getBilling = (id: string) => getData<Billing>(ENDPOINTS.billings.byId(id));

/** Creates the invoice and deducts qty from UAE_MAIN STORE. */
export const createBilling = async (input: CreateBillingInput) =>
  (await api.post<{ data: Billing }>(ENDPOINTS.billings.root, input)).data;

export const deleteBilling = (id: string) => api.delete(ENDPOINTS.billings.byId(id));
