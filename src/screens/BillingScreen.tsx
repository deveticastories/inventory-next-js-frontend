"use client";

import { useState } from "react";
import Badge from "@/components/Badge";
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
import { errorMessage } from "@/services/ApiClient";
import { createBilling, getAllBillings, updateBillingPayment } from "@/services/BillingServices";
import { getAllCustomers } from "@/services/CustomerServices";
import { getUaeMainStock } from "@/services/UaeStoreServices";
import type { Billing, Customer } from "@/types";
import { customerName } from "@/utils/Display";
import { aed, BAL_EPS, fmtDate, nextCode, num, sum, today } from "@/utils/Format";
import { esc, printDoc } from "@/utils/Print";

type Line = { stockId: string; style: string; product: string; qty: number; price: number };

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Payment recorded at billing time; receipt entries are tracked separately. */
const payStatus = (b: Billing) => (!b.paidAmount ? "Unpaid" : b.isPaid ? "Paid" : "Partial");
const STATUS_TONE = { Paid: "ok", Partial: "warn", Unpaid: "neutral" } as const;

/** Inline error for the Amount paid field, or "" when valid. */
const amountError = (raw: string, total: number) => {
  const v = raw.trim();
  if (!v) return "Enter the amount paid.";
  if (!/^-?\d*\.?\d+$/.test(v) || /\.\d{3,}$/.test(v)) return "Enter a valid amount, e.g. 1000.00.";
  const n = Number(v);
  if (n < 0) return "Amount cannot be less than 0.";
  if (n === 0) return "Amount must be greater than 0. Uncheck Paid if nothing was received.";
  if (round2(n) > round2(total)) return `Amount cannot exceed the invoice total (${aed(total)}).`;
  return "";
};

const printBill = (b: Billing, customers: Customer[]) => {
  const c = typeof b.customer === "object" && b.customer ? b.customer : customers.find((x) => x._id === b.customer);
  return printDoc(
    `Invoice ${b.invoiceNo}`,
    ["Style no", "Product", "Qty", "Unit price", "Amount"],
    b.products.map((l) => [l.styleNo, l.productName, l.qty, aed(l.unitPrice), aed(l.amount)]),
    `<p class="m">Customer: <b>${esc(c?.name)}</b> · ${esc(c?.contactNo)} · Date: ${esc(fmtDate(b.date))}</p>` +
      `<p><b>Total: ${esc(aed(b.invoiceTotal))}</b><br>Amount paid: ${esc(aed(b.paidAmount ?? 0))}<br>` +
      `<b>Balance due: ${esc(aed(b.balanceAmount))}</b> · ${esc(payStatus(b))}</p>`,
  );
};

export default function BillingScreen() {
  const { toast } = useUI();
  const [open, setOpen] = useState(false);
  const q = useApi(() => Promise.all([getAllBillings(), getAllCustomers()]));

  if (!q.data) return <LoadState error={q.error} onRetry={q.reload} />;
  const [bills, customers] = q.data;
  const print = (b: Billing) => !printBill(b, customers) && toast("Couldn't open the print dialog", "error");

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
          head={["Invoice no", "Date", "Customer", "Amount", "Returns", "Net", "Paid", "Received", "Balance", "Status", ""]}
          empty="No invoices yet"
          rowKeys={bills.map((b) => b._id)}
          rows={bills.map((b) => [
            <span key="n" className="mono">{b.invoiceNo}</span>,
            fmtDate(b.date),
            <b key="c">{customerName(b.customer)}</b>,
            aed(b.invoiceTotal),
            aed(b.returnAmount),
            aed(b.netAmount),
            aed(b.paidAmount ?? 0),
            aed(b.receivedAmount),
            <span key="bal" className={`amount ${b.balanceAmount > BAL_EPS ? "bad" : "ok"}`}>{aed(b.balanceAmount)}</span>,
            <Badge key="st" tone={STATUS_TONE[payStatus(b)]}>
              {payStatus(b)}
            </Badge>,
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
  const [paid, setPaid] = useState(false);
  const [paidAmt, setPaidAmt] = useState("");

  if (!stockQ.data) return <LoadState error={stockQ.error} onRetry={stockQ.reload} />;
  const stock = stockQ.data.data;

  const total = round2(sum(lines, (l) => l.qty * l.price));
  const payErr = paid ? amountError(paidAmt, total) : "";
  const full = paid && !payErr && round2(num(paidAmt)) === total;

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
    if (payErr) return toast(payErr, "error");
    run(async () => {
      let inv = await createBilling({
        date,
        customer: cust,
        products: lines.map((l) => ({ uaeMainStock: l.stockId, qty: l.qty, unitPrice: l.price })),
      });
      if (paid) {
        // Compare against the server's total so the status matches its balance check.
        const amt = round2(num(paidAmt));
        try {
          inv = await updateBillingPayment(inv._id, {
            paidAmount: amt,
            paidStatus: amt >= round2(inv.balanceAmount) ? "Fully Paid" : "Partial Paid",
          });
        } catch (e) {
          // The invoice exists either way — keep it and tell the cashier the payment didn't record.
          toast(`${inv.invoiceNo} saved as Unpaid — payment not recorded: ${errorMessage(e)}`, "error");
          return onCreated(inv);
        }
      }
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
      <Totals items={[["Total qty", sum(lines, (l) => l.qty)], ["Invoice total", aed(total)]]} />
      <div className="pay-row">
        <label className="pay-check">
          <input
            type="checkbox"
            checked={paid}
            onChange={(e) => {
              setPaid(e.target.checked);
              setPaidAmt(e.target.checked ? total.toFixed(2) : "");
            }}
          />
          Paid
        </label>
        {paid && (
          <>
            <div className="field pay-field">
              <label>Amount paid</label>
              <div className={`pay-input ${payErr ? "pay-input-error" : ""}`}>
                <span>AED</span>
                <Input autoFocus inputMode="decimal" value={paidAmt} onChange={(e) => setPaidAmt(e.target.value)} aria-invalid={!!payErr} />
              </div>
              {payErr && <small className="pay-error">{payErr}</small>}
            </div>
            {!payErr && (
              <div className="pay-status">
                <Badge tone={full ? "ok" : "warn"}>{full ? "Paid" : "Partial payment"}</Badge>
                <span>
                  Balance due: <b>{aed(round2(total - num(paidAmt)))}</b>
                </span>
              </div>
            )}
          </>
        )}
      </div>
      <div className="actions">
        <Button variant="success" icon="print" onClick={generate} disabled={busy || !!payErr}>
          Generate &amp; print
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}
