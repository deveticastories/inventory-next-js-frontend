import { ENDPOINTS } from "@/constants/ApiConstants";
import type { Store, StoreLocation } from "@/types";
import { api, getAllPages } from "./ApiClient";

export interface CreateStoreInput {
  name: string;
  location: StoreLocation;
  contactNumber: string;
  /** User id of a Biller / Purchaser. */
  inCharge: string;
}

export const getAllStores = () => getAllPages<Store>(ENDPOINTS.stores.root);

export const createStore = async (input: CreateStoreInput) =>
  (await api.post<{ data: Store }>(ENDPOINTS.stores.root, input)).data;

export const updateStore = async (id: string, input: Partial<CreateStoreInput>) =>
  (await api.put<{ data: Store }>(ENDPOINTS.stores.byId(id), input)).data;

export const deleteStore = (id: string) => api.delete(ENDPOINTS.stores.byId(id));

/**
 * TRP_MAIN STORE / TRP_SAMPLE STORE are ordinary IND stores — the stock
 * transfer API needs their ids, so they are looked up by name.
 */
export async function getIndStores() {
  const ind = (await getAllStores()).filter((s) => s.location === "IND");
  const find = (word: string) => ind.find((s) => s.name.toUpperCase().includes(word));
  return { main: find("MAIN"), sample: find("SAMPLE") };
}
