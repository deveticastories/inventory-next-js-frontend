import { ENDPOINTS } from "@/constants/ApiConstants";
import type { MainStockLine, WithSummary } from "@/types";
import { api } from "./ApiClient";

type StockSort = "date" | "vendor" | "product";

/** TRP_MAIN STORE: QC-approved stock still available. */
export const getMainStock = (search?: string, sortBy?: StockSort) =>
  api.get<WithSummary<MainStockLine>>(ENDPOINTS.indStore.mainStock, { search, sortBy });

/** TRP_SAMPLE STORE: stock moved in from TRP_MAIN STORE. */
export const getSampleStock = (search?: string, sortBy?: StockSort) =>
  api.get<WithSummary<MainStockLine>>(ENDPOINTS.indStore.sampleStock, { search, sortBy });

export interface TransferToSampleInput {
  fromStore: string;
  toStore: string;
  products: { qualityCheckProduct: string; qty: number }[];
}

export const transferStock = (input: TransferToSampleInput) => api.post(ENDPOINTS.indStore.root, input);
