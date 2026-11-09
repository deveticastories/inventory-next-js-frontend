import { ENDPOINTS } from "@/constants/ApiConstants";
import type { QualityCheck } from "@/types";
import { api, getData } from "./ApiClient";

export interface SubmitQualityCheckInput {
  purchaseEntry: string;
  /** A damage qty is required for every product of the invoice. */
  products: { purchaseEntryProduct: string; damageQty: number }[];
  /** Name of the person who checked the goods, typed in by the user. */
  checkedByName: string;
}

/** Completes QC: posts stock to TRP_MAIN STORE and the payable to the vendor. */
export const submitQualityCheck = (input: SubmitQualityCheckInput) => api.post(ENDPOINTS.qualityChecks.root, input);

export const getAllQualityChecks = () => getData<QualityCheck[]>(ENDPOINTS.qualityChecks.root);

export const getQualityCheckByPurchase = (purchaseEntryId: string) =>
  getData<QualityCheck>(ENDPOINTS.qualityChecks.byPurchaseEntry(purchaseEntryId));
