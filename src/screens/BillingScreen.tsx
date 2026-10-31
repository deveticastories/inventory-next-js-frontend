"use client";

import { useState } from "react";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Combo from "@/components/Combo";
import DataTable, { Totals } from "@/components/DataTable";
import { Field, Input, Value } from "@/components/Field";
import LoadState from "@/components/LoadState";
import PageHeader from "@/components/PageHeader";
import { useUI } from "@/components/UIProvider";
import { useApi } from "@/hooks/useApi";
import { useSubmit } from "@/hooks/useSubmit";
import { createBilling, getAllBillings } from "@/services/BillingServices";
import { getAllCustomers } from "@/services/CustomerServices";
import { getUaeMainStock } from "@/services/UaeStoreServices";
import type { Billing, Customer } from "@/types";
import { customerName } from "@/utils/Display";
import { aed, BAL_EPS, fmtDate, nextCode, num, sum, today } from "@/utils/Format";
import { esc, printDoc } from "@/utils/Print";

type Line = { stockId: string; style: string; product: string; qty: number; price: number };

const printBill = (b: Billing, customers: Customer[]) => {
  const c = typeof b.customer === "object" && b.customer ? b.customer : customers.find((x) => x._id === b.customer);
  return printDoc(
    `Invoice ${b.invoiceNo}`,
    ["Style no", "Product", "Qty", "Unit price", "Amount"],
    b.products.map((l) => [l.styleNo, l.productName, l.qty, aed(l.unitPrice), aed(l.amount)]),
    `<p class="m">Customer: <b>${esc(c?.name)}</b> · ${esc(c?.contactNo)} · Date: ${esc(fmtDate(b.date))}</p><p><b>Total: ${esc(aed(b.invoiceTotal))}</b></p>`,
  );
};

export default function BillingScreen() {
  const { toast } = useUI();
  const [open, setOpen] = useState(false);
  const q = useApi(() => Promise.all([getAllBillings(), getAllCustomers()]));

  if (!q.data) return <LoadState error={q.error} onRetry={q.reload} />;
  const [bills, customers] = q.data;
  const print = (b: Billing) => !printBill(b, customers) && toast("Allow pop-ups to download / print", "error");

  return (
    <>
      <PageHeader
        eyebrow="UAE"
        title="Billing"
        subtitle="Create customer invoices from UAE_MAIN STORE"
        actions={
          !open && (
            <Button icon="plus" onClick={() => setOpen(true)}>
              Create
            </Button>
          )
        }
      />
      {open && (
        <BillForm
          bills={bills}
          customers={customers}
          onCancel={() => setOpen(false)}
          onCreated={(b) => {
            setOpen(false);
            q.reload();
            print(b);
          }}
        />
      )}
      <Card title="Invoices" icon="receipt">
        <DataTable
          head={["Invoice no", "Date", "Customer", "Amount", "Returns", "Net", "Received", "Balance", ""]}
          empty="No invoices yet"
          rowKeys={bills.map((b) => b._id)}
          rows={bills.map((b) => [
            <span key="n" className="mono">{b.invoiceNo}</span>,
            fmtDate(b.date),
            <b key="c">{customerName(b.customer)}</b>,
            aed(b.invoiceTotal),
            aed(b.returnAmount),
            aed(b.netAmount),
            aed(b.receivedAmount),
            <span key="bal" className={`amount ${b.balanceAmount > BAL_EPS ? "bad" : "ok"}`}>{aed(b.balanceAmount)}</span>,
            <Button key="p" variant="ghost" size="sm" icon="print" onClick={() => print(b)}>
              Print
            </Button>,
          ])}
        />
      </Card>
    </>
  );
}

function BillForm({
  bills,
  customers,
  onCancel,
  onCreated,
}: {
  bills: Billing[];
  customers: Customer[];
  onCancel: () => void;
  onCreated: (b: Billing) => void;
}) {
  const { toast } = useUI();
  const { busy, run } = useSubmit();
  const stockQ = useApi(() => getUaeMainStock());
  const [date, setDate] = useState(today);
  const [cust, setCust] = useState("");
  const [sty, setSty] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [lines, setLines] = useState<Line[]>([]);

  if (!stockQ.data) return <LoadState error={stockQ.error} onRetry={stockQ.reload} />;
  const stock = stockQ.data.data;

  const u = stock.find((x) => x._id === sty);
  const avail = u ? u.qty - sum(lines.filter((l) => l.stockId === u._id), (l) => l.qty) : null;

  const add = () => {
    const q = num(qty), p = num(price);
    if (!u || q <= 0 || p <= 0) return toast("Select style, qty and price", "error");
    if (!Number.isInteger(q)) return toast("Qty must be a whole number", "error");
    if (q > avail!) return toast(`Only ${avail} available`, "error");
    setLines([...lines, { stockId: u._id, style: u.styleNo, product: u.productName, qty: q, price: p }]);
    setQty("");
  };

  const generate = () => {
    if (!cust) return toast("Select a customer", "error");
    if (!lines.length) return toast("Add at least one item", "error");
    run(async () => {
      const inv = await createBilling({
        date,
        customer: cust,
        products: lines.map((l) => ({ uaeMainStock: l.stockId, qty: l.qty, unitPrice: l.price })),
      });
      toast(`${inv.invoiceNo} generated`);
      onCreated(inv);
    });
  };

  return (
    <Card title="New invoice" icon="receipt">
      <div className="grid">
        <Field label="Invoice no (auto)">
          <Input readOnly value={nextCode("INV-", bills.map((b) => b.invoiceNo))} />
        </Field>
        <Field label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Customer name">
          <Combo options={customers.map((c) => ({ value: c._id, label: c.name }))} value={cust} onChange={setCust} placeholder="Search customer…" />
        </Field>
      </div>
      <div className="row mt">
        <Field label="Style no">
          <Combo
            options={stock.filter((x) => x.qty > 0).map((x) => ({ value: x._id, label: `${x.styleNo} — ${x.productName}` }))}
            value={sty}
            onChange={(v) => {
              setSty(v);
              const s = stock.find((x) => x._id === v);
              setPrice(s ? s.sellingPriceAED.toFixed(2) : "");
            }}
            placeholder="Search style…"
          />
        </Field>
        <Field label="Available qty" style={{ flex: "none", width: 120 }}>
          <Value strong>{avail ?? "—"}</Value>
        </Field>
        <Field label="Qty" style={{ flex: "none", width: 110 }}>
          <Input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} />
        </Field>
        <Field label="Selling price (AED, editable)" style={{ flex: "none", width: 200 }}>
          <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        </Field>
        <Button icon="plus" onClick={add}>
          Add
        </Button>
      </div>
      <div className="mt">
        <DataTable
          head={["Style no", "Product", "Qty", "Unit price", "Amount", ""]}
          empty="No items added"
          rows={lines.map((l, i) => [
            <span key="s" className="mono">{l.style}</span>,
            <b key="p">{l.product}</b>,
            l.qty,
            aed(l.price),
            <span key="a" className="amount">{aed(l.qty * l.price)}</span>,
            <Button key="r" variant="ghost" size="sm" icon="trash" onClick={() => setLines(lines.filter((_, j) => j !== i))}>
              Remove
            </Button>,
          ])}
        />
      </div>
      <Totals items={[["Total qty", sum(lines, (l) => l.qty)], ["Invoice total", aed(sum(lines, (l) => l.qty * l.price))]]} />
      <div className="actions">
        <Button variant="success" icon="print" onClick={generate} disabled={busy}>
          Generate &amp; print
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}
