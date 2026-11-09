/* Shapes returned by inventory-node-backend. Dates arrive as ISO strings. */

export interface Option {
  value: string;
  label: string;
}

export interface Pagination {
  currentPage: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface Paged<T> {
  data: T[];
  pagination: Pagination;
}

/** Stock screens return totals alongside the rows. */
export interface StockSummary {
  /** null when legacy rows make the server total NaN */
  stockVolume: number | null;
  stockValue: number | null;
}

export interface WithSummary<T> {
  summary: StockSummary;
  data: T[];
}

/* ---------- masters ---------- */
export type StaffType = "Admin" | "Biller" | "Purchaser";

export interface User {
  _id: string;
  staffName: string;
  mobileNumber: string;
  employeeId: string;
  email: string;
  employeeType: StaffType;
  status?: boolean;
}

export interface Vendor {
  _id: string;
  vendorName: string;
  contactNo: string;
  bankName: string;
  accountNo: string;
  ifsc: string;
  outstandingAmount?: number;
}

export interface VendorPurchasePosition {
  _id: string;
  invoiceNo: string;
  purchaseDate: string;
  qcStatus: QcStatus;
  invoiceAmount: number;
  paidAmount: number;
  balanceAmount: number | null;
}

export interface VendorLedgerEntry {
  date: string;
  type: "Payable after QC" | "Payment";
  reference: string;
  payable: number;
  paid: number;
  runningOutstanding: number;
}

export interface VendorDetails {
  vendor: Vendor;
  outstandingAmount: number;
  purchases: VendorPurchasePosition[];
  paymentHistory: VendorLedgerEntry[];
}

export type StoreLocation = "IND" | "UAE";

export interface Store {
  _id: string;
  name: string;
  location: StoreLocation;
  contactNumber: string;
  /** Populated on list / detail, an id otherwise. */
  inCharge: User | string | null;
}

export interface Customer {
  _id: string;
  name: string;
  contactNo: string;
  whatsAppNo: string;
  address: string;
  email: string;
  outstandingAmount?: number;
}

export interface StatementInvoice {
  _id: string;
  invoiceNo: string;
  date: string;
  invoiceTotal: number;
  returnAmount: number;
  netAmount: number;
  receivedAmount: number;
  balanceAmount: number;
}

export interface CustomerStatement {
  customer: Customer;
  outstandingAmount: number;
  invoices: StatementInvoice[];
}

/* ---------- purchase ---------- */
export type QcStatus = "Pending" | "Done";

export interface PurchaseProduct {
  _id: string;
  productName: string;
  purchaseQty: number;
  purchaseRate: number;
  amount: number;
}

export interface PurchaseEntry {
  _id: string;
  invoiceNo: string;
  purchaseDate: string;
  /** Populated on list, an id on create. */
  vendor: Vendor | string | null;
  products: PurchaseProduct[];
  totalProductQty: number;
  totalAmount: number;
  totalIncludingGST: number;
  qcStatus: QcStatus;
}

export interface QcLine {
  purchaseEntryProduct: string;
  productName: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface QualityCheck {
  _id: string;
  purchaseEntry: {
    _id: string;
    invoiceNo: string;
    purchaseDate: string;
    vendor: Vendor | null;
    totalIncludingGST: number;
  };
  checkedBy: { _id: string; staffName?: string; employeeId?: string; email?: string } | null;
  /** Name typed in at submit; older records only have `checkedBy`. */
  checkedByName?: string;
  checkedAt: string;
  summary: {
    totalApprovedQty: number;
    availableQtyAfterQC: number;
    damagedQty: number;
    payableAfterQC: number;
  };
  approvedProducts: QcLine[];
  damagedProducts: QcLine[];
}

/* ---------- IND store ---------- */
export interface MainStockLine {
  qualityCheck: string;
  qualityCheckProduct: string;
  purchaseEntry: string;
  invoiceNo: string;
  purchaseDate: string;
  vendor: { _id: string; vendorName: string } | null;
  productName: string;
  purchaseQtyAfterQC: number;
  sampleQty: number;
  packedQty: number;
  availableQty: number;
  rate: number;
}

/* ---------- expenses ---------- */
export type PayMode = "Cash" | "Upi" | "Account";

export interface DailyExpense {
  _id: string;
  date: string;
  expenseType: string;
  paymentType: PayMode;
  amount: number;
  description?: string;
  /** "Open" until attached to a packing list, then the packing ID. */
  packingId: string;
}

/* ---------- packing / transit ---------- */
export type PackingListStatus = "Pending" | "In Transit queue" | "Completed";

export interface PackingStyle {
  _id: string;
  styleNo: string;
  productName: string;
  vendor: Vendor | string;
  qty: number;
  rate: number;
  sellingPriceAED: number;
  moved: boolean;
  transferDate?: string;
  transit?: { perPcAED: number; expenseRecAED: number; updatedUnitRateAED: number };
}

export interface PackingList {
  _id: string;
  packingId: string;
  packingDate: string;
  salary: number;
  totalQty: number;
  totalExpense: number;
  styles: PackingStyle[];
  dailyExpenses: DailyExpense[] | string[];
  packingListStatus: PackingListStatus;
}

export interface PackingProductAvailability {
  productName: string;
  availableQty: number;
}

export interface PackingVendorAvailability {
  vendor: { _id: string; vendorName: string };
  availableQty: number;
}

export interface TransitStyle {
  _id: string;
  styleNo: string;
  productName: string;
  qty: number;
  unitRateINR: number;
  perPcAED: number;
  expenseRecAED: number;
  updatedUnitRateAED: number;
  sellingPriceAED: number;
  moved: boolean;
  transferDate?: string;
  status: "In UAE store" | "Pending";
}

export interface TransitDetails {
  packingList: { _id: string; packingId: string; packingDate: string; packingListStatus: PackingListStatus };
  exchangeRate: number;
  profitPercent: number;
  additionalExpenses: number;
  expenseRecommendationAED: number;
  styles: TransitStyle[];
}

export interface Settings {
  exchangeRate: number;
  profitPercent: number;
}

/* ---------- UAE store ---------- */
export interface UaeMainStock {
  _id: string;
  styleNo: string;
  productName: string;
  qty: number;
  costAED: number;
  sellingPriceAED: number;
  transitDate: string;
}

export type ReturnReason = "Damage" | "Size issue" | "Other";
export type ReturnType = "Fully" | "Partial";

export interface UaeReturnRow {
  _id: string;
  returnId: string;
  returnNo: string;
  invoice: string;
  invoiceNo: string;
  styleNo: string;
  productName: string;
  returnedQty: number;
  reason: ReturnReason;
  returnType: ReturnType;
  unitPrice: number;
  invoiceValue: number;
  updatedInvoiceValue: number;
  inStore: number;
  returnDate: string;
}

export interface ReturnableLine {
  billingProduct: string;
  uaeMainStock: string;
  styleNo: string;
  productName: string;
  invoicedQty: number;
  returnedQty: number;
  returnableQty: number;
  unitPrice: number;
}

export interface Returnable {
  invoice: { _id: string; invoiceNo: string; date: string; customer: string };
  products: ReturnableLine[];
}

/* ---------- billing ---------- */
export interface BillingProduct {
  _id: string;
  uaeMainStock: UaeMainStock | string;
  styleNo: string;
  productName: string;
  qty: number;
  unitPrice: number;
  costAED: number;
  amount: number;
}

export interface Billing {
  _id: string;
  invoiceNo: string;
  date: string;
  customer: Customer | string | null;
  products: BillingProduct[];
  totalQty: number;
  invoiceTotal: number;
  returnAmount: number;
  netAmount: number;
  receivedAmount: number;
  balanceAmount: number;
  isPaid?: boolean;
  paidStatus?: BillingPaidStatus;
  /** Paid at billing time (separate from receipt entries). */
  paidAmount?: number;
}

export type BillingPaidStatus = "Fully Paid" | "Partial Paid";

/* ---------- payments / receipts ---------- */
export interface PaymentEntry {
  _id: string;
  paymentVoucherNo: string;
  paymentDate?: string;
  createdAt?: string;
  purchaseInvoice: (Omit<PurchaseEntry, "vendor"> & { vendor: Vendor | null }) | string;
  vendor: string;
  payableAmount: number;
  paidAmount: number;
  balanceAmount: number;
}

export interface PayableInvoice {
  _id: string;
  invoiceNo: string;
  purchaseDate: string;
  vendor: Vendor | null;
  payableAmount: number;
  paidAmount: number;
  balanceAmount: number;
}

export interface ReceiptEntry {
  _id: string;
  receiptNo: string;
  receiptDate?: string;
  createdAt?: string;
  invoice: (Omit<Billing, "customer"> & { customer: Customer | null }) | null;
  receivableAmount: number;
  receivedAmount: number;
  balanceAmount: number;
}

export interface ReceivableInvoice {
  _id: string;
  invoiceNo: string;
  date: string;
  customer: { _id: string; name: string; contactNo: string } | null;
  netAmount: number;
  receivedAmount: number;
  balanceAmount: number;
}

/* ---------- reports ---------- */
export interface Dashboard {
  stats: {
    vendorOutstanding: number;
    customerOutstanding: number;
    indMainStockValue: number;
    uaeMainStockValue: number;
    netSales: number;
    expensesBooked: number;
  };
  pendingActions: {
    purchaseInvoicesWaitingForQC: number;
    vendorsWithBalance: number;
    customerInvoicesWithBalance: number;
    expensesNotAttachedToPackingList: number;
  };
}

export interface PurchaseReportRow extends Omit<PurchaseEntry, "vendor"> {
  vendor: Vendor | null;
  qualityCheck: { payableAfterQC: number } | null;
  payments: { paidAmount: number }[];
}

export interface SalesReportRow extends Omit<Billing, "customer"> {
  customer: Customer | null;
}

export interface CreditReportRow {
  _id: string;
  receiptNo: string;
  receiptDate?: string;
  createdAt?: string;
  receivedAmount: number;
  invoice: { invoiceNo: string; date: string } | null;
  customer: { name: string } | null;
}

export type DebitReportRow =
  | (PaymentEntry & { type: "PaymentEntry"; reportDate: string; vendor: Vendor | null })
  | (DailyExpense & { type: "DailyExpense"; reportDate: string });

export interface DamageReportRow {
  source: string;
  reference: string;
  date: string;
  productName: string;
  qty: number;
  value: number;
  currency: "INR" | "AED";
}

export interface ValuedRow {
  value: number;
}
