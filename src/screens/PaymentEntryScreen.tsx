"use client";

import { useState } from "react";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Combo from "@/components/Combo";
import { Field, Input, Value } from "@/components/Field";
import ListBlock, { useListFilter } from "@/components/ListBlock";
import LoadState from "@/components/LoadState";
import Modal from "@/components/Modal";
import PageHeader from "@/components/PageHeader";
import { useUI } from "@/components/UIProvider";
import { useApi } from "@/hooks/useApi";
import { useSubmit } from "@/hooks/useSubmit";
import { createPayment, getAllPayments, getPayableInvoices, updatePayment } from "@/services/PaymentServices";
import type { PaymentEntry } from "@/types";
import { vendorName } from "@/utils/Display";
import { BAL_EPS, fmtDate, inr, isoDay, nextCode, nf, num, today } from "@/utils/Format";
import { printDoc } from "@/utils/Print";

type Sort = "all" | "paid" | "out" | "vendor";

const invoiceOf = (x: PaymentEntry) => (typeof x.purchaseInvoice === "object" ? x.purchaseInvoice : null);
const invoiceIdOf = (x: PaymentEntry) => (typeof x.purchaseInvoice === "object" ? x.purchaseInvoice?._id : x.purchaseInvoice);

export default function PaymentEntryScreen() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentEntry | null>(null);
  const filter = useListFilter<Sort>("all");
  const q = useApi(
    () => getAllPayments(filter.s === "paid" ? "paid" : filter.s === "out" ? "outstanding" : "all", filter.s === "vendor" ? "vendor" : "date"),
    [filter.s],
  );
  // every voucher, for the next voucher number
  const all = useApi(() => getAllPayments());

  const reload = () => {
    q.reload();
    all.reload();
  };

  return (
    <>
      <PageHeader
        eyebrow="Finance"
        title="Payment Entry"
        subtitle="Pay vendors against QC-approved purchase invoices"
        actions={
          !open && (
            <Button icon="plus" onClick={() => setOpen(true)}>
              New
            </Button>
          )
        }
      />
      {open && <PaymentForm nextNo={nextCode("PAY-", (all.data ?? []).map((x) => x.paymentVoucherNo))} onSaved={reload} onClose={() => setOpen(false)} />}
      {editing && <EditPaymentModal entry={editing} all={all.data ?? []} onClose={() => setEditing(null)} onSaved={reload} />}
      {!q.data ? (
        <LoadState error={q.error} onRetry={q.reload} />
      ) : (
        <Card title="Payment entries" icon="arrowUp">
          <ListBlock
            title="Payment Entries"
            filter={filter}
            sorts={[
              ["all", "Show: All"],
              ["paid", "Paid purchase invoices"],
              ["out", "Outstanding purchase invoices"],
              ["vendor", "Sort: Vendor name"],
            ]}
            head={["Paid date", "Voucher no", "Purchase invoice no", "Purchase invoice date", "Vendor name", "Payable amount", "Paid amount", "Balance amount", "Action"]}
            rowKeys={q.data.map((x) => x._id)}
            rows={q.data.map((x) => {
              const inv = invoiceOf(x);
              return [
                fmtDate(x.paymentDate ?? x.createdAt),
                <span key="v" className="mono">{x.paymentVoucherNo}</span>,
                <span key="i" className="mono">{inv?.invoiceNo ?? "—"}</span>,
                fmtDate(inv?.purchaseDate),
                <b key="n">{vendorName(inv?.vendor)}</b>,
                inr(x.payableAmount),
                <span key="p" className="amount ok">{inr(x.paidAmount)}</span>,
                <span key="b" className="amount">{inr(x.balanceAmount)}</span>,
                <Button key="e" size="sm" variant="ghost" onClick={() => setEditing(x)}>
                  Edit
                </Button>,
              ];
            })}
          />
        </Card>
      )}
    </>
  );
}

type Voucher = { no: string; date: string; inv: string; vendor: string; payable: number; paid: number; balance: number };

function PaymentForm({ nextNo, onSaved, onClose }: { nextNo: string; onSaved: () => void; onClose: () => void }) {
  const { toast } = useUI();
  const { busy, run } = useSubmit();
  const q = useApi(getPayableInvoices);
  const [inv, setInv] = useState("");
  const [amount, setAmount] = useState("");
  const [paidDate, setPaidDate] = useState(today);
  const [last, setLast] = useState<Voucher | null>(null);
  const p = q.data?.find((x) => x._id === inv);
  const due = p?.balanceAmount ?? 0;

  const save = () => {
    const a = num(amount);
    if (!p) return toast("Select an invoice", "error");
    if (a <= 0 || a > due + 0.01) return toast(`Paid amount must be 0 – ${nf(due)}`, "error");
    if (!paidDate) return toast("Pick the paid date", "error");
    run(async () => {
      const x = await createPayment({ purchaseInvoice: p._id, paidAmount: a, paymentDate: paidDate });
      setLast({
        no: x.paymentVoucherNo,
        date: x.paymentDate ?? paidDate,
        inv: p.invoiceNo,
        vendor: vendorName(p.vendor),
        payable: x.payableAmount,
        paid: x.paidAmount,
        balance: x.balanceAmount,
      });
      setInv("");
      setAmount("");
      toast(`Payment saved — ${x.paymentVoucherNo}`);
      q.reload();
      onSaved();
    });
  };

  const download = () => {
    if (!last) return toast("Save a voucher first", "error");
    const ok = printDoc(
      `Payment voucher ${last.no}`,
      ["Date", "Invoice", "Vendor", "Payable", "Paid", "Balance"],
      [[fmtDate(last.date), last.inv, last.vendor, inr(last.payable), inr(last.paid), inr(last.balance)]],
    );
    if (!ok) toast("Couldn't open the print dialog", "error");
  };

  return (
    <Card title="New payment voucher" icon="arrowUp">
      {q.error && <LoadState error={q.error} onRetry={q.reload} />}
      <div className="grid">
        <Field label="Payment voucher no (auto)">
          <Input readOnly value={nextNo} />
        </Field>
        <Field label="Purchase invoice no">
          <Combo
            key={last?.no}
            options={(q.data ?? []).map((x) => ({ value: x._id, label: `${x.invoiceNo} — ${vendorName(x.vendor)} (due ${inr(x.balanceAmount)})` }))}
            value={inv}
            onChange={setInv}
            placeholder={q.data ? "Search invoice…" : "Loading invoices…"}
          />
        </Field>
        <Field label="Purchase invoiced date">
          <Value>{p ? fmtDate(p.purchaseDate) : "—"}</Value>
        </Field>
        <Field label="Vendor name">
          <Value>{p ? vendorName(p.vendor) : "—"}</Value>
        </Field>
        <Field label="Payable amount">
          <Value strong>{p ? inr(due) : "—"}</Value>
        </Field>
        <Field label="Paid date">
          <Input type="date" max={today()} value={paidDate} onChange={(e) => setPaidDate(e.target.value)} />
        </Field>
        <Field label="Paid amount (₹)">
          <Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Balance amount">
          <Value strong tone={p && due - num(amount) > BAL_EPS ? "danger" : "success"}>
            {p ? inr(due - num(amount)) : "—"}
          </Value>
        </Field>
      </div>
      <div className="actions">
        <Button variant="success" icon="check" onClick={save} disabled={busy}>
          OK
        </Button>
        <Button variant="ghost" icon="download" onClick={download}>
          Download voucher
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </Card>
  );
}

function EditPaymentModal({ entry, all, onClose, onSaved }: { entry: PaymentEntry; all: PaymentEntry[]; onClose: () => void; onSaved: () => void }) {
  const { toast } = useUI();
  const { busy, run } = useSubmit();
  const [paidDate, setPaidDate] = useState(isoDay(entry.paymentDate ?? entry.createdAt));
  const [amount, setAmount] = useState(String(entry.paidAmount));
  const inv = invoiceOf(entry);

  // this voucher's amount can grow by whatever is still unpaid on the invoice (latest voucher's balance)
  const vouchers = all.filter((v) => invoiceIdOf(v) === invoiceIdOf(entry));
  const latest = vouchers.reduce<PaymentEntry>((a, v) => ((v.createdAt ?? "") > (a.createdAt ?? "") ? v : a), entry);
  const max = entry.paidAmount + latest.balanceAmount;

  const save = () => {
    const a = num(amount);
    if (!paidDate) return toast("Pick the paid date", "error");
    if (a <= 0 || a > max + 0.01) return toast(`Paid amount must be 0 – ${nf(max)}`, "error");
    const input: { paidAmount?: number; paymentDate?: string } = {};
    if (Math.abs(a - entry.paidAmount) > BAL_EPS) input.paidAmount = a;
    if (paidDate !== isoDay(entry.paymentDate ?? entry.createdAt)) input.paymentDate = paidDate;
    if (!Object.keys(input).length) return onClose();
    run(async () => {
      await updatePayment(entry._id, input);
      toast(`Payment updated — ${entry.paymentVoucherNo}`);
      onSaved();
      onClose();
    });
  };

  return (
    <Modal
      title={`Edit payment ${entry.paymentVoucherNo}`}
      subtitle={`${inv?.invoiceNo ?? "—"} · ${vendorName(inv?.vendor)}`}
      onClose={() => !busy && onClose()}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="success" icon="check" onClick={save} loading={busy}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      <div className="grid">
        <Field label="Paid date">
          <Input type="date" max={today()} value={paidDate} disabled={busy} onChange={(e) => setPaidDate(e.target.value)} />
        </Field>
        <Field label="Paid amount (₹)" hint={`Up to ${inr(max)}`}>
          <Input type="number" min={0} step="0.01" value={amount} disabled={busy} onChange={(e) => setAmount(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
