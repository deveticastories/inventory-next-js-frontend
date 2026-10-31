"use client";

import { useState } from "react";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Combo from "@/components/Combo";
import { Field, Input, Value } from "@/components/Field";
import ListBlock, { useListFilter } from "@/components/ListBlock";
import LoadState from "@/components/LoadState";
import Modal from "@/components/Modal";
import Notice from "@/components/Notice";
import PageHeader from "@/components/PageHeader";
import StatCard, { StatGrid } from "@/components/StatCard";
import Tabs from "@/components/Tabs";
import { useUI } from "@/components/UIProvider";
import { useApi } from "@/hooks/useApi";
import { useSubmit } from "@/hooks/useSubmit";
import { getMainStock, getSampleStock, transferStock } from "@/services/IndStoreServices";
import { getIndStores } from "@/services/StoreServices";
import type { MainStockLine } from "@/types";
import { vendorName } from "@/utils/Display";
import { byDateDesc, fmtDate, hit, inr, num } from "@/utils/Format";

type Sort = "date" | "vendor" | "product";
const SORTS: [Sort, string][] = [
  ["date", "Sort: Purchase date"],
  ["vendor", "Sort: Vendor"],
  ["product", "Sort: Product"],
];
const sortLines = (r: MainStockLine[], s: Sort) =>
  [...r].sort((a, b) =>
    s === "vendor"
      ? vendorName(a.vendor).localeCompare(vendorName(b.vendor))
      : s === "product"
        ? a.productName.localeCompare(b.productName)
        : byDateDesc(a.purchaseDate, b.purchaseDate),
  );
const matches = (l: MainStockLine, q: string) => hit(q, l.productName, vendorName(l.vendor));

export default function IndStoreScreen() {
  const [tab, setTab] = useState<"main" | "sample">("main");
  const [transfer, setTransfer] = useState(false);
  const mainF = useListFilter<Sort>("date");
  const sampleF = useListFilter<Sort>("date");
  const q = useApi(() => Promise.all([getMainStock(), getSampleStock()]));

  if (!q.data) return <LoadState error={q.error} onRetry={q.reload} />;
  const [main, sample] = q.data;

  return (
    <>
      <PageHeader
        eyebrow="India"
        title="IND Store Stock"
        subtitle="TRP_MAIN STORE and TRP_SAMPLE STORE"
        actions={
          tab === "main" && (
            <Button icon="swap" onClick={() => setTransfer(true)}>
              Transfer to TRP_SAMPLE STORE
            </Button>
          )
        }
      />
      <Tabs
        tabs={[
          { value: "main", label: "TRP_MAIN STORE" },
          { value: "sample", label: "TRP_SAMPLE STORE" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "main" ? (
        <div key="main" className="reveal">
          <StatGrid>
            <StatCard label="Stock volume (qty)" value={main.summary.stockVolume ?? 0} icon="layers" tone="primary" />
            <StatCard label="Stock value" value={main.summary.stockValue ?? 0} format={inr} icon="rupee" tone="success" />
          </StatGrid>
          <Card>
            <ListBlock
              title="TRP_MAIN STORE Stock"
              filter={mainF}
              searchPlaceholder="Search product / vendor"
              sorts={SORTS}
              head={["Invoice no", "Purchase date", "Product", "Vendor", "Purchase qty (after QC)", "Available qty", "Rate / pc"]}
              rows={sortLines(main.data.filter((l) => matches(l, mainF.q)), mainF.s).map((l) => [
                <span key="i" className="mono">{l.invoiceNo}</span>,
                fmtDate(l.purchaseDate),
                <b key="n">{l.productName}</b>,
                vendorName(l.vendor),
                l.purchaseQtyAfterQC,
                <span key="a" className="amount">{l.availableQty}</span>,
                inr(l.rate),
              ])}
            />
          </Card>
        </div>
      ) : (
        <div key="sample" className="reveal">
          <Notice>Stock reaches this store only by transfer from TRP_MAIN STORE.</Notice>
          <StatGrid>
            <StatCard label="Stock volume (qty)" value={sample.summary.stockVolume ?? 0} icon="layers" tone="info" />
            <StatCard label="Stock value" value={sample.summary.stockValue ?? 0} format={inr} icon="rupee" tone="success" />
          </StatGrid>
          <Card>
            <ListBlock
              title="TRP_SAMPLE STORE Stock"
              filter={sampleF}
              searchPlaceholder="Search product / vendor"
              sorts={SORTS}
              head={["Invoice no", "Purchase date", "Product", "Vendor", "Sample qty", "Rate / pc"]}
              rows={sortLines(sample.data.filter((l) => matches(l, sampleF.q)), sampleF.s).map((l) => [
                <span key="i" className="mono">{l.invoiceNo}</span>,
                fmtDate(l.purchaseDate),
                <b key="n">{l.productName}</b>,
                vendorName(l.vendor),
                <span key="q" className="amount">{l.sampleQty}</span>,
                inr(l.rate),
              ])}
            />
          </Card>
        </div>
      )}

      {transfer && <TransferSampleModal lines={main.data} onClose={() => setTransfer(false)} onDone={q.reload} />}
    </>
  );
}

function TransferSampleModal({ lines, onClose, onDone }: { lines: MainStockLine[]; onClose: () => void; onDone: () => void }) {
  const { toast } = useUI();
  const { busy, run } = useSubmit();
  const [item, setItem] = useState("");
  const [qty, setQty] = useState("");
  const l = lines.find((x) => x.qualityCheckProduct === item);

  const submit = () => {
    const q = num(qty);
    if (!l) return toast("Select a product", "error");
    if (q <= 0 || q > l.availableQty || !Number.isInteger(q)) return toast(`Qty must be 1 – ${l.availableQty}`, "error");
    run(async () => {
      const { main, sample } = await getIndStores();
      if (!main || !sample) throw new Error("Create TRP_MAIN STORE and TRP_SAMPLE STORE (location IND) in Stores first");
      await transferStock({ fromStore: main._id, toStore: sample._id, products: [{ qualityCheckProduct: l.qualityCheckProduct, qty: q }] });
      toast("Transferred to TRP_SAMPLE STORE");
      onDone();
      onClose();
    });
  };

  return (
    <Modal
      title="Transfer to TRP_SAMPLE STORE"
      subtitle="Move QC-approved stock into the sample store"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button icon="swap" onClick={submit} disabled={busy}>
            Transfer
          </Button>
        </>
      }
    >
      <div className="grid">
        <Field label="Product">
          <Combo
            options={lines
              .filter((x) => x.availableQty > 0)
              .map((x) => ({ value: x.qualityCheckProduct, label: `${x.productName} — ${x.invoiceNo} (avail ${x.availableQty})` }))}
            value={item}
            onChange={setItem}
            placeholder="Search product…"
          />
        </Field>
        <Field label="Available qty">
          <Value strong>{l ? l.availableQty : "—"}</Value>
        </Field>
        <Field label="Transfer qty">
          <Input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
