import { ENDPOINTS } from "@/constants/ApiConstants";
import type { Settings } from "@/types";
import { api, getData } from "./ApiClient";

/** Transit rates: 1 AED = exchangeRate INR, selling price = cost + profitPercent. */
export const getSettings = () => getData<Settings>(ENDPOINTS.settings.root);

export const updateSettings = async (input: Partial<Settings>) =>
  (await api.put<{ data: Settings }>(ENDPOINTS.settings.root, input)).data;
