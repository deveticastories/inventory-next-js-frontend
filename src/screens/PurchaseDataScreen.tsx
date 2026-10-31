"use client";

import { useState } from "react";
import Card from "@/components/Card";
import Combo from "@/components/Combo";
import DataTable from "@/components/DataTable";
import { Field } from "@/components/Field";
import LoadState from "@/components/LoadState";
import Notice from "@/components/Notice";
import PageHeader from "@/components/PageHeader";
import PageSkeleton from "@/components/PageSkeleton";
import StatCard, { StatGrid } from "@/components/StatCard";
import { useApi } from "@/hooks/useApi";
import { getAllPurchaseEntries } from "@/services/PurchaseServices";
import { getQualityCheckByPurchase } from "@/services/QualityCheckServices";
import type { QualityCheck } from "@/types";
import { purchaseOptions, vendorName } from "@/utils/Display";
import { inr } from "@/utils/Format";

export default function PurchaseDataScreen() {
  const q = useApi(getAllPurchaseEntries);
  const [inv, setInv] = useState("");
  const p = q.data?.find((x) => x._id === inv);
  const done = p?.qcStatus === "Done";
  const qc = useApi<QualityCheck | null>(() => (p && done ? getQualityCheckByPurchase(p._id) : Promise.resolve(null)), [p?._id, done]);

  if (!q.data) return <LoadState error={q.error} onRetry={q.reload} />;
  const data = qc.data && qc.data.purchaseEntry._id === p?._id ? qc.data : null;

  return (
    <>
      <PageHeader eyebrow="Purchase" title="Purchase Data" subtitle="Approved vs damaged items and payable amount after QC" />
      <Card title="Select invoice" icon="search">
        <Field label="Invoice no" style={{ maxWidth: 460 }}>
          <Combo options={purchaseOptions(q.data)} value={inv} onChange={setInv} placeholder="Search invoice…" />
        </Field>
      </Card>

      {p && !done && (
        <Notice tone="warn">
          Quality check is pending for <b>{p.invoiceNo}</b>. Payable amount appears after QC is completed.
        </Notice>
      )}

      {p && done && !data && (qc.error ? <LoadState error={qc.error} onRetry={qc.reload} /> : <PageSkeleton />)}

      {p && done && data && (
        <div key={p._id} className="reveal">
          <StatGrid>
            <StatCard label="Vendor" value={vendorName(data.purchaseEntry.vendor)} icon="truck" tone="primary" />
            <StatCard label="Available qty after QC" value={data.summary.availableQtyAfterQC} icon="box" tone="info" />
            <StatCard label="Damaged qty" value={data.summary.damagedQty} icon="alert" tone="danger" />
            <StatCard label="Payable after QC" value={data.summary.payableAfterQC} format={inr} icon="rupee" tone="success" />
          </StatGrid>
          <Card title="Approved products" icon="check">
            <DataTable
              head={["Product", "Qty", "Per pc rate", "Amount"]}
              rows={data.approvedProducts.map((i) => [<b key="n">{i.productName}</b>, i.qty, inr(i.rate), <span key="a" className="amount ok">{inr(i.amount)}</span>])}
            />
          </Card>
          <Card title="Damaged products" icon="alert">
            <DataTable
              head={["Product", "Qty", "Per pc rate", "Amount"]}
              empty="No damaged items"
              rows={data.damagedProducts.map((i) => [<b key="n">{i.productName}</b>, i.qty, inr(i.rate), <span key="a" className="amount bad">{inr(i.amount)}</span>])}
            />
          </Card>
          <Notice>
            Payable = approved value adjusted for GST ({inr(data.purchaseEntry.totalIncludingGST)} invoice total). This amount is posted to{" "}
            <b>{vendorName(data.purchaseEntry.vendor)}</b>&apos;s payment history.
          </Notice>
        </div>
      )}
    </>
  );
}
