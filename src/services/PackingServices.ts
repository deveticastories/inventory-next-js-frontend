import { ENDPOINTS } from "@/constants/ApiConstants";
import type { PackingList, PackingProductAvailability, PackingVendorAvailability, Paged, TransitDetails } from "@/types";
import { api, getAllPages, getData } from "./ApiClient";

export interface CreatePackingInput {
  packingDate: string;
  salary: number;
  /** Daily expense ids — only "Open" ones can be attached. */
  dailyExpenses: string[];
  styles: { styleNo: string; productName: string; vendor: string; qty: number }[];
}

/** Newest packing date first. */
export const getAllPackingLists = () => getAllPages<PackingList>(ENDPOINTS.packingLists.root);

/** The packing list Transit works on: the most recent one. */
export const getLatestPackingList = async () =>
  (await api.get<Paged<PackingList>>(ENDPOINTS.packingLists.root, { page: 1, limit: 1 })).data[0] ?? null;

export const createPackingList = async (input: CreatePackingInput) =>
  (await api.post<{ data: PackingList }>(ENDPOINTS.packingLists.root, input)).data;

export const deletePackingList = (id: string) => api.delete(ENDPOINTS.packingLists.byId(id));

/* ---- TRP_MAIN STORE availability while adding styles ---- */
export const getPackableProducts = () => getData<PackingProductAvailability[]>(ENDPOINTS.packingLists.availableStock);

export const getPackableVendors = (productName: string) =>
  getData<PackingVendorAvailability[]>(ENDPOINTS.packingLists.availableStock, { productName });

/* ---- Transit ---- */
export const getTransitDetails = (id: string) => getData<TransitDetails>(ENDPOINTS.packingLists.transit(id));

/** Moves the selected styles into UAE_MAIN STORE at the current rates. */
export const transferStylesToUae = async (id: string, styleIds: string[]) =>
  (await api.patch<{ data: TransitDetails }>(ENDPOINTS.packingLists.transferToUae(id), { styleIds })).data;
