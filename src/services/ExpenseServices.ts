import { ENDPOINTS } from "@/constants/ApiConstants";
import type { DailyExpense, PayMode } from "@/types";
import { api, getAllPages } from "./ApiClient";

export interface CreateExpenseInput {
  date: string;
  expenseType: string;
  paymentType: PayMode;
  amount: number;
  description?: string;
}

/** Newest first. */
export const getAllExpenses = () => getAllPages<DailyExpense>(ENDPOINTS.dailyExpenses.root);

export const createExpense = async (input: CreateExpenseInput) =>
  (await api.post<{ data: DailyExpense }>(ENDPOINTS.dailyExpenses.root, input)).data;

export const deleteExpense = (id: string) => api.delete(ENDPOINTS.dailyExpenses.byId(id));
