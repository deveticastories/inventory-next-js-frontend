"use client";

import { useState } from "react";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Combo from "@/components/Combo";
import DataTable, { Totals } from "@/components/DataTable";
import { Field, Input } from "@/components/Field";
import LoadState from "@/components/LoadState";
import PageHeader from "@/components/PageHeader";
import { useUI } from "@/components/UIProvider";
import { useApi } from "@/hooks/useApi";
import { useSubmit } from "@/hooks/useSubmit";
import { createPurchaseEntry, getAllPurchaseEntries } from "@/services/PurchaseServices";
import { getAllVendors } from "@/services/VendorServices";
import { vendorName } from "@/utils/Display";
import { fmtDate, inr, num, sum, today } from "@/utils/Format";

type Item = { key: number; name: string; qty: number; rate: number };

export default function ItemMasterScreen() {
  const { toast } = useUI();
  const { busy, run } = useSubmit();
  const q = useApi(() => Promise.all([getAllPurchaseEntries(), getAllVendors()]));
  const [date, setDate] = useState(today);
  const [vendor, setVendor] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [gst, setGst] = useState("");
  const [line, setLine] = useState({ name: "", qty: "", rate: "" });

  if (!q.data) return <LoadState error={q.error} onRetry={q.reload} />;
  const [purchases, vendors] = q.data;

  const total = sum(items, (i) => i.qty * i.rate);
  // the server numbers invoices as count of entries + 1
  const invNo = `PUR-${String(purchases.length + 1).padStart(4, "0")}`;

  const addItem = () => {
    const n = line.name.trim(), qty = num(line.qty), r = num(line.rate);
    if (!n || qty <= 0 || r <= 0) return toast("Enter product, qty and rate", "error");
    if (!Number.isInteger(qty)) return toast("Purchase qty must be a whole number", "error");
    setItems([...items, { key: Date.now(), name: n, qty, rate: r }]);
    setLine({ name: "", qty: "", rate: "" });
  };

  const save = () => {
    if (!vendor) return toast("Select a vendor", "error");
    if (!items.length) return toast("Add at least one product", "error");
    run(async () => {
      const p = await createPurchaseEntry({
        purchaseDate: date,
        vendor,
        products: items.map((i) => ({ productName: i.name, purchaseQty: i.qty, purchaseRate: i.rate })),
        ...(num(gst) > 0 && { totalIncludingGST: num(gst) }),
      });
      setItems([]);
      setVendor("");
      setGst("");
      setDate(today());
      toast(`${p.invoiceNo} saved — send to Quality Check`);
      q.reload();
    });
  };

  return (
    <>
      <PageHeader eyebrow="Purchase" title="Item Master — Purchase Entry" subtitle="Create a purchase invoice with multiple products" />
      <Card title="Invoice details" icon="file">
        <div className="grid">
          <Field label="Invoice no (auto)">
            <Input readOnly value={invNo} />
          </Field>
          <Field label="Purchase date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Vendor name">
            <Combo options={vendors.map((v) => ({ value: v._id, label: v.vendorName }))} value={vendor} onChange={setVendor} placeholder="Search vendor…" />
          </Field>
        </div>
      </Card>

      <Card title="Product entry" icon="cart">
        <div className="row">
          <Field label="Product name">
            <Input value={line.name} onChange={(e) => setLine({ ...line, name: e.target.value })} placeholder="e.g. Cotton Kurti" />
          </Field>
          <Field label="Purchase qty">
            <Input type="number" min={1} value={line.qty} onChange={(e) => setLine({ ...line, qty: e.target.value })} />
          </Field>
          <Field label="Purchase rate per pc (₹)">
            <Input
              type="number"
              min={0}
              step="0.01"
              value={line.rate}
              onChange={(e) => setLine({ ...line, rate: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
            />
          </Field>
          <Button icon="plus" onClick={addItem}>
            Add
          </Button>
        </div>
        <div className="mt">
          <DataTable
            head={["#", "Product", "Qty", "Rate / pc", "Amount", ""]}
            empty="No products added"
            rowKeys={items.map((i) => i.key)}
            rows={items.map((i, k) => [
              k + 1,
              <b key="n">{i.name}</b>,
              i.qty,
              inr(i.rate),
              <span key="a" className="amount">{inr(i.qty * i.rate)}</span>,
              <Button key="x" variant="ghost" size="sm" icon="trash" onClick={() => setItems(items.filter((_, j) => j !== k))}>
                Remove
              </Button>,
            ])}
          />
        </div>
        <Totals items={[["Total product qty", sum(items, (i) => i.qty)], ["Total amount", inr(total)]]} />
        <div className="actions end">
          <Field label="Total including GST (₹)" style={{ width: 240 }}>
            <Input type="number" step="0.01" value={gst} placeholder={total ? total.toFixed(2) : ""} onChange={(e) => setGst(e.target.value)} />
          </Field>
          <Button variant="success" icon="check" onClick={save} disabled={busy} style={{ alignSelf: "flex-end" }}>
            Save invoice
          </Button>
        </div>
      </Card>

      <Card title="Recent invoices" icon="clock">
        <DataTable
          head={["Invoice", "Date", "Vendor", "Qty", "Amount", "Incl. GST", "QC"]}
          rowKeys={purchases.map((x) => x._id)}
          rows={purchases.map((x) => [
            <span key="i" className="mono">{x.invoiceNo}</span>,
            fmtDate(x.purchaseDate),
            vendorName(x.vendor),
            x.totalProductQty,
            inr(x.totalAmount),
            <span key="g" className="amount">{inr(x.totalIncludingGST)}</span>,
            x.qcStatus === "Done" ? <Badge key="q" tone="ok">Done</Badge> : <Badge key="q" tone="warn">Pending</Badge>,
          ])}
        />
      </Card>
    </>
  );
}
