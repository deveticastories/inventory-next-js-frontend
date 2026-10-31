import { ENDPOINTS } from "@/constants/ApiConstants";
import type { Vendor, VendorDetails } from "@/types";
import { api, getAllPages, getData } from "./ApiClient";

export interface CreateVendorInput {
  vendorName: string;
  contactNo: string;
  bankName?: string;
  accountNo?: string;
  ifsc?: string;
}

/** Vendors with their outstanding (QC payable − payments). */
export const getAllVendors = () => getAllPages<Vendor>(ENDPOINTS.vendors.root);

export const getVendorDetails = (id: string) => getData<VendorDetails>(ENDPOINTS.vendors.details(id));

export const createVendor = async (input: CreateVendorInput) =>
  (await api.post<{ data: Vendor }>(ENDPOINTS.vendors.root, input)).data;

export const updateVendor = async (id: string, input: Partial<CreateVendorInput>) =>
  (await api.put<{ data: Vendor }>(ENDPOINTS.vendors.byId(id), input)).data;

export const deleteVendor = (id: string) => api.delete(ENDPOINTS.vendors.byId(id));
