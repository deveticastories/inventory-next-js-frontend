import { ENDPOINTS } from "@/constants/ApiConstants";
import type { Customer, CustomerStatement } from "@/types";
import { api, getAllPages, getData } from "./ApiClient";

export interface CreateCustomerInput {
  name: string;
  contactNo: string;
  whatsAppNo: string;
  address: string;
  email: string;
}

export type StatementFilter = "all" | "paid" | "outstanding";

/** Customers with their outstanding (sum of invoice balances). */
export const getAllCustomers = () => getAllPages<Customer>(ENDPOINTS.customers.root);

export const getCustomerStatement = (id: string, status: StatementFilter = "all") =>
  getData<CustomerStatement>(ENDPOINTS.customers.statement(id), { status });

export const createCustomer = async (input: CreateCustomerInput) =>
  (await api.post<{ data: Customer }>(ENDPOINTS.customers.root, input)).data;

export const updateCustomer = async (id: string, input: Partial<CreateCustomerInput>) =>
  (await api.put<{ data: Customer }>(ENDPOINTS.customers.byId(id), input)).data;

export const deleteCustomer = (id: string) => api.delete(ENDPOINTS.customers.byId(id));
