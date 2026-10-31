import { ENDPOINTS } from "@/constants/ApiConstants";
import type { PurchaseEntry } from "@/types";
import { api, getAllPages, getData } from "./ApiClient";

export interface CreatePurchaseInput {
  purchaseDate: string;
  vendor: string;
  products: { productName: string; purchaseQty: number; purchaseRate: number }[];
  /** Blank falls back to the product total on the server. */
  totalIncludingGST?: number;
}

/** Newest first, vendor populated. */
export const getAllPurchaseEntries = () => getAllPages<PurchaseEntry>(ENDPOINTS.purchaseEntries.root);

export const getPurchaseEntry = (id: string) => getData<PurchaseEntry>(ENDPOINTS.purchaseEntries.byId(id));

export const createPurchaseEntry = async (input: CreatePurchaseInput) =>
  (await api.post<{ data: PurchaseEntry }>(ENDPOINTS.purchaseEntries.root, input)).data;

export const updatePurchaseEntry = async (id: string, input: Partial<CreatePurchaseInput>) =>
  (await api.put<{ data: PurchaseEntry }>(ENDPOINTS.purchaseEntries.byId(id), input)).data;

export const deletePurchaseEntry = (id: string) => api.delete(ENDPOINTS.purchaseEntries.byId(id));
