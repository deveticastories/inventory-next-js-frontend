"use client";

import { useState } from "react";
import Card from "@/components/Card";
import ListBlock, { useListFilter } from "@/components/ListBlock";
import LoadState from "@/components/LoadState";
import PageHeader from "@/components/PageHeader";
import Tabs from "@/components/Tabs";
import { useApi } from "@/hooks/useApi";
import * as R from "@/services/ReportServices";
import { customerName, vendorName } from "@/utils/Display";
import { aed, fmtDate, hit, inr, sum } from "@/utils/Format";

type Table = { head: string[]; rows: (string | number)[][] };
type Report = { title: string; tab: string; load: () => Promise<Table> };

const REPORTS: Record<string, Report> = {
  purchase: {
    title: "Purchase report",
    tab: "Purchase",
    load: async () => ({
      head: ["Invoice", "Date", "Vendor", "Qty", "Amount", "Incl. GST", "QC", "Payable", "Paid", "Balance"],
      rows: (await R.getPurchaseReport()).map((p) => {
        const qc = p.qcStatus === "Done" && p.qualityCheck;
        const payable = qc ? p.qualityCheck!.payableAfterQC : 0;
        const paid = sum(p.payments ?? [], (x) => x.paidAmount);
        return [
          p.invoiceNo, fmtDate(p.purchaseDate), vendorName(p.vendor), p.totalProductQty, inr(p.totalAmount), inr(p.totalIncludingGST),
          p.qcStatus, qc ? inr(payable) : "—", inr(paid), qc ? inr(payable - paid) : "—",
        ];
      }),
    }),
  },
  sales: {
    title: "Sales report",
    tab: "Sales",
    load: async () => ({
      head: ["Invoice", "Date", "Customer", "Qty", "Amount", "Returns", "Net", "Received", "Balance"],
      rows: (await R.getSalesReport()).map((b) => [
        b.invoiceNo, fmtDate(b.date), customerName(b.customer), b.totalQty, aed(b.invoiceTotal), aed(b.returnAmount),
        aed(b.netAmount), aed(b.receivedAmount), aed(b.balanceAmount),
      ]),
    }),
  },
  stock: {
    title: "IND stock report",
    tab: "IND stock",
    load: async () => ({
      head: ["Invoice", "Date", "Product", "Vendor", "Qty after QC", "Available", "Rate", "Value"],
      rows: (await R.getIndStockReport()).map((l) => [
        l.invoiceNo, fmtDate(l.purchaseDate), l.productName, vendorName(l.vendor), l.purchaseQtyAfterQC, l.availableQty, inr(l.rate), inr(l.value),
      ]),
    }),
  },
  ustock: {
    title: "UAE stock report",
    tab: "UAE stock",
    load: async () => ({
      head: ["Style", "Product", "Transit date", "Avl qty", "Cost", "Selling price", "Value"],
      rows: (await R.getUaeStockReport()).map((u) => [
        u.styleNo, u.productName, fmtDate(u.transitDate), u.qty, aed(u.costAED), aed(u.sellingPriceAED), aed(u.value),
      ]),
    }),
  },
  credit: {
    title: "Credit report (receipts)",
    tab: "Credit",
    load: async () => ({
      head: ["Date", "Receipt", "Invoice", "Customer", "Received"],
      rows: (await R.getCreditReport()).map((r) => [
        fmtDate(r.receiptDate ?? r.createdAt), r.receiptNo, r.invoice?.invoiceNo ?? "—", customerName(r.customer), aed(r.receivedAmount),
      ]),
    }),
  },
  debit: {
    title: "Debit report (payments & expenses)",
    tab: "Debit",
    load: async () => ({
      head: ["Date", "Type", "Reference", "Party / description", "Mode", "Amount"],
      rows: (await R.getDebitReport()).map((d) =>
        d.type === "PaymentEntry"
          ? [fmtDate(d.reportDate), "Vendor payment", d.paymentVoucherNo, vendorName(d.vendor), "—", inr(d.paidAmount)]
          : [fmtDate(d.reportDate), "Expense", d.expenseType, d.description ?? "", d.paymentType, inr(d.amount)],
      ),
    }),
  },
  sample: {
    title: "Sample stock report",
    tab: "Sample",
    load: async () => ({
      head: ["Invoice", "Product", "Vendor", "Sample qty", "Rate", "Value"],
      rows: (await R.getSampleStockReport()).map((l) => [l.invoiceNo, l.productName, vendorName(l.vendor), l.sampleQty, inr(l.rate), inr(l.value)]),
    }),
  },
  damage: {
    title: "Damage stock report",
    tab: "Damage",
    load: async () => ({
      head: ["Source", "Reference", "Product", "Qty", "Value"],
      rows: (await R.getDamageReport()).map((r) => [r.source, r.reference ?? "—", r.productName, r.qty, r.currency === "AED" ? aed(r.value) : inr(r.value)]),
    }),
  },
  return: {
    title: "Return report",
    tab: "Return",
    load: async () => ({
      head: ["Date", "Invoice", "Style", "Product", "Returned qty", "Reason", "Value"],
      rows: (await R.getReturnReport()).map((r) => [fmtDate(r.returnDate), r.invoiceNo, r.styleNo, r.productName, r.returnedQty, r.reason, aed(r.value)]),
    }),
  },
  transit: {
    title: "Transit report",
    tab: "Transit",
    load: async () => ({
      head: ["Packing", "Date", "Style", "Product", "Qty", "Unit INR", "Updated AED", "Selling AED", "Status"],
      rows: (await R.getTransitReport()).flatMap((k) =>
        k.styles.map((l) => [
          k.packingId, fmtDate(k.packingDate), l.styleNo, l.productName, l.qty, inr(l.rate),
          l.moved && l.transit ? aed(l.transit.updatedUnitRateAED) : "—", l.moved ? aed(l.sellingPriceAED) : "—",
          l.moved ? "Moved to UAE" : "Pending",
        ]),
      ),
    }),
  },
};

export default function ReportsScreen() {
  const [rep, setRep] = useState("purchase");

  return (
    <>
      <PageHeader eyebrow="Analysis" title="Reports" subtitle="Pick a report and download it as PDF" />
      <Tabs tabs={Object.entries(REPORTS).map(([value, x]) => ({ value, label: x.tab }))} value={rep} onChange={setRep} />
      {/* keyed so switching tabs drops the previous report and its search */}
      <ReportTable key={rep} report={REPORTS[rep]!} />
    </>
  );
}

/** Loads one report from the API and shows it with search + PDF download. */
function ReportTable({ report: r }: { report: Report }) {
  const filter = useListFilter<"">("");
  const q = useApi(r.load);
  if (!q.data) return <LoadState error={q.error} onRetry={q.reload} />;
  return (
    <Card title={r.title} icon="chart" className="reveal">
      <ListBlock
        title={r.title}
        filter={filter}
        searchPlaceholder="Search in report"
        head={q.data.head}
        rows={q.data.rows.filter((x) => hit(filter.q, ...x))}
      />
    </Card>
  );
}
