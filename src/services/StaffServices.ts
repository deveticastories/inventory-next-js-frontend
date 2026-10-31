import { ENDPOINTS } from "@/constants/ApiConstants";
import type { StaffType, User } from "@/types";
import { api, getAllPages } from "./ApiClient";

export interface CreateStaffInput {
  staffName: string;
  mobileNumber: string;
  employeeId: string;
  email: string;
  password: string;
  employeeType: StaffType;
}

export const getAllStaff = () => getAllPages<User>(ENDPOINTS.users.root);

export const createStaff = async (input: CreateStaffInput) =>
  (await api.post<{ user: User }>(ENDPOINTS.users.root, input)).user;

export const updateStaff = async (id: string, input: Partial<CreateStaffInput>) =>
  (await api.put<{ user: User }>(ENDPOINTS.users.byId(id), input)).user;

export const updateStaffStatus = async (id: string, status: boolean) =>
  (await api.patch<{ user: User }>(ENDPOINTS.users.status(id), { status })).user;

export const deleteStaff = (id: string) => api.delete(ENDPOINTS.users.byId(id));
