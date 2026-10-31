import { ENDPOINTS } from "@/constants/ApiConstants";
import type {
  CreditReportRow,
  Dashboard,
  DamageReportRow,
  DebitReportRow,
  MainStockLine,
  PackingList,
  PurchaseReportRow,
  SalesReportRow,
  UaeMainStock,
  UaeReturnRow,
  ValuedRow,
} from "@/types";
import { getAllPages, getData } from "./ApiClient";

export const getDashboard = () => getData<Dashboard>(ENDPOINTS.reports.dashboard);

export const getPurchaseReport = () => getAllPages<PurchaseReportRow>(ENDPOINTS.reports.purchase);
export const getSalesReport = () => getAllPages<SalesReportRow>(ENDPOINTS.reports.sales);
export const getIndStockReport = () => getAllPages<MainStockLine & ValuedRow>(ENDPOINTS.reports.indStock);
export const getUaeStockReport = () => getAllPages<UaeMainStock & ValuedRow>(ENDPOINTS.reports.uaeStock);
export const getCreditReport = () => getAllPages<CreditReportRow>(ENDPOINTS.reports.credit);
export const getDebitReport = () => getAllPages<DebitReportRow>(ENDPOINTS.reports.debit);
export const getSampleStockReport = () => getAllPages<MainStockLine & ValuedRow>(ENDPOINTS.reports.sampleStock);
export const getDamageReport = () => getAllPages<DamageReportRow>(ENDPOINTS.reports.damage);
export const getReturnReport = () => getAllPages<UaeReturnRow & ValuedRow>(ENDPOINTS.reports.return);
export const getTransitReport = () => getAllPages<PackingList>(ENDPOINTS.reports.transit);
