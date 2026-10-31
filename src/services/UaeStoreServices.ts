import { ENDPOINTS } from "@/constants/ApiConstants";
import type { ReturnReason, ReturnType, Returnable, UaeMainStock, UaeReturnRow, WithSummary } from "@/types";
import { api, getData } from "./ApiClient";

type UaeSort = "date" | "style" | "product";

export const getUaeMainStock = (search?: string, sortBy?: UaeSort) =>
  api.get<WithSummary<UaeMainStock>>(ENDPOINTS.uaeStore.mainStock, { search, sortBy });

export const getUaeReturnStock = (search?: string, sortBy?: UaeSort) =>
  api.get<WithSummary<UaeReturnRow>>(ENDPOINTS.uaeStore.returnStock, { search, sortBy });

/** Invoice lines with how much can still be returned. */
export const getReturnable = (invoiceId: string) => getData<Returnable>(ENDPOINTS.uaeStore.returnable(invoiceId));

export interface CreateReturnInput {
  invoice: string;
  returnType: ReturnType;
  reason: ReturnReason;
  /** Required for Partial; Fully returns every returnable line. */
  products?: { billingProduct: string; qty: number }[];
}

/** Books a customer return into UAE_RETURN STORE and updates the invoice balance. */
export const createReturn = (input: CreateReturnInput) => api.post(ENDPOINTS.uaeStore.root, input);

/** Moves non-damaged returned qty back to UAE_MAIN STORE. */
export const moveReturnToMain = (input: { returnId: string; returnProduct: string; qty: number }) =>
  api.post(ENDPOINTS.uaeStore.moveToMain, input);

export const deleteReturn = (id: string) => api.delete(ENDPOINTS.uaeStore.byId(id));
