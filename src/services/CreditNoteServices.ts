import { ENDPOINTS } from "@/constants/ApiConstants";
import type { CreditNote } from "@/types";
import { api } from "./ApiClient";

export interface CreditNoteInput {
  amount: number;
  description?: string;
}

/** Every fund entry, newest first (this endpoint isn't paginated). */
export const getAllCreditNotes = async () =>
  (await api.get<{ creditNotes: { creditNoteList: CreditNote[] } }>(ENDPOINTS.creditNotes.root)).creditNotes.creditNoteList;

export const createCreditNote = async (input: CreditNoteInput) =>
  (await api.post<{ creditNote: CreditNote }>(ENDPOINTS.creditNotes.root, input)).creditNote;

export const updateCreditNote = async (id: string, input: CreditNoteInput) =>
  (await api.patch<{ creditNote: CreditNote }>(ENDPOINTS.creditNotes.byId(id), input)).creditNote;

export const deleteCreditNote = (id: string) => api.delete(ENDPOINTS.creditNotes.byId(id));
