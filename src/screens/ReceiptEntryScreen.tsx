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
import { createReceipt, getAllReceipts, getReceivableInvoices, updateReceipt } from "@/services/ReceiptServices";
import type { ReceiptEntry } from "@/types";
import { customerName } from "@/utils/Display";
import { aed, BAL_EPS, fmtDate, isoDay, nextCode, nf, num, today } from "@/utils/Format";
import { printDoc } from "@/utils/Print";

type Sort = "all" | "paid" | "out" | "cust";

export default function ReceiptEntryScreen() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ReceiptEntry | null>(null);
  const filter = useListFilter<Sort>("all");
  const q = useApi(
    () => getAllReceipts(filter.s === "paid" ? "paid" : filter.s === "out" ? "outstanding" : "all", filter.s === "cust" ? "customer" : "date"),
    [filter.s],
  );
  // every receipt, for the next receipt number
  const all = useApi(() => getAllReceipts());

  const reload = () => {
    q.reload();
    all.reload();
  };

  return (
    <>
      <PageHeader
        eyebrow="Finance"
        title="Receipt Entry"
        subtitle="Receive money against customer invoices"
        actions={
          !open && (
            <Button icon="plus" onClick={() => setOpen(true)}>
              New
            </Button>
          )
        }
      />
      {open && <ReceiptForm nextNo={nextCode("REC-", (all.data ?? []).map((x) => x.receiptNo))} onSaved={reload} onClose={() => setOpen(false)} />}
      {editing && <EditReceiptModal entry={editing} onClose={() => setEditing(null)} onSaved={reload} />}
      {!q.data ? (
        <LoadState error={q.error} onRetry={q.reload} />
      ) : (
        <Card title="Receipt entries" icon="arrowDown">
          <ListBlock
            title="Receipt Entries"
            filter={filter}
            sorts={[
              ["all", "Show: All"],
              ["paid", "Paid invoices"],
              ["out", "Outstanding invoices"],
              ["cust", "Sort: Customer name"],
            ]}
            empty="No receipts yet"
            head={["Paid date", "Receipt no", "Invoice no", "Invoice date", "Customer name", "Receivable amount", "Received amount", "Balance amount", "Action"]}
            rowKeys={q.data.map((x) => x._id)}
            rows={q.data.map((x) => [
              fmtDate(x.receiptDate ?? x.createdAt),
              <span key="r" className="mono">{x.receiptNo}</span>,
              <span key="i" className="mono">{x.invoice?.invoiceNo ?? "—"}</span>,
              fmtDate(x.invoice?.date),
              <b key="c">{customerName(x.invoice?.customer)}</b>,
              aed(x.receivableAmount),
              <span key="d" className="amount ok">{aed(x.receivedAmount)}</span>,
              <span key="b" className="amount">{aed(x.balanceAmount)}</span>,
              <Button key="e" size="sm" variant="ghost" onClick={() => setEditing(x)}>
                Edit
              </Button>,
            ])}
          />
        </Card>
      )}
    </>
  );
}

type Slip = { no: string; date: string; inv: string; cust: string; recv: number; recd: number; balance: number };

function ReceiptForm({ nextNo, onSaved, onClose }: { nextNo: string; onSaved: () => void; onClose: () => void }) {
  const { toast } = useUI();
  const { busy, run } = useSubmit();
  const q = useApi(getReceivableInvoices);
  const [inv, setInv] = useState("");
  const [amount, setAmount] = useState("");
  const [paidDate, setPaidDate] = useState(today);
  const [last, setLast] = useState<Slip | null>(null);
  const b = q.data?.find((x) => x._id === inv);
  const due = b?.balanceAmount ?? 0;

  const save = () => {
    const a = num(amount);
    if (!b) return toast("Select an invoice", "error");
    if (a <= 0 || a > due + 0.01) return toast(`Received amount must be 0 – ${nf(due)}`, "error");
    if (!paidDate) return toast("Pick the paid date", "error");
    run(async () => {
      const x = await createReceipt({ invoice: b._id, receivedAmount: a, receiptDate: paidDate });
      setLast({
        no: x.receiptNo,
        date: x.receiptDate ?? paidDate,
        inv: b.invoiceNo,
        cust: customerName(b.customer),
        recv: x.receivableAmount,
        recd: x.receivedAmount,
        balance: x.balanceAmount,
      });
      setInv("");
      setAmount("");
      toast(`Receipt saved — ${x.receiptNo}`);
      q.reload();
      onSaved();
    });
  };

  const download = () => {
    if (!last) return toast("Save a receipt first", "error");
    const ok = printDoc(
      `Receipt ${last.no}`,
      ["Date", "Invoice", "Customer", "Receivable", "Received", "Balance"],
      [[fmtDate(last.date), last.inv, last.cust, aed(last.recv), aed(last.recd), aed(last.balance)]],
    );
    if (!ok) toast("Couldn't open the print dialog", "error");
  };

  return (
    <Card title="New receipt" icon="arrowDown">
      {q.error && <LoadState error={q.error} onRetry={q.reload} />}
      <div className="grid">
        <Field label="Receipt no (auto)">
          <Input readOnly value={nextNo} />
        </Field>
        <Field label="Invoice no">
          <Combo
            key={last?.no}
            options={(q.data ?? []).map((x) => ({ value: x._id, label: `${x.invoiceNo} — ${customerName(x.customer)} (due ${aed(x.balanceAmount)})` }))}
            value={inv}
            onChange={setInv}
            placeholder={q.data ? "Search invoice…" : "Loading invoices…"}
          />
        </Field>
        <Field label="Invoiced date">
          <Value>{b ? fmtDate(b.date) : "—"}</Value>
        </Field>
        <Field label="Customer name">
          <Value>{b ? customerName(b.customer) : "—"}</Value>
        </Field>
        <Field label="Receivable amount">
          <Value strong>{b ? aed(due) : "—"}</Value>
        </Field>
        <Field label="Paid date">
          <Input type="date" max={today()} value={paidDate} onChange={(e) => setPaidDate(e.target.value)} />
        </Field>
        <Field label="Received amount (AED)">
          <Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Balance amount">
          <Value strong tone={b && due - num(amount) > BAL_EPS ? "danger" : "success"}>
            {b ? aed(due - num(amount)) : "—"}
          </Value>
        </Field>
      </div>
      <div className="actions">
        <Button variant="success" icon="check" onClick={save} disabled={busy}>
          OK
        </Button>
        <Button variant="ghost" icon="download" onClick={download}>
          Download receipt
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </Card>
  );
}

function EditReceiptModal({ entry, onClose, onSaved }: { entry: ReceiptEntry; onClose: () => void; onSaved: () => void }) {
  const { toast } = useUI();
  const { busy, run } = useSubmit();
  const origDate = isoDay(entry.receiptDate ?? entry.createdAt);
  const [paidDate, setPaidDate] = useState(origDate);
  const [amount, setAmount] = useState(String(entry.receivedAmount));
  // this receipt's amount can grow by whatever is still unpaid on the invoice
  const max = entry.receivedAmount + (entry.invoice?.balanceAmount ?? 0);

  const save = () => {
    const a = num(amount);
    if (!paidDate) return toast("Pick the paid date", "error");
    if (a <= 0 || a > max + 0.01) return toast(`Received amount must be 0 – ${nf(max)}`, "error");
    const input: { receivedAmount?: number; receiptDate?: string } = {};
    if (Math.abs(a - entry.receivedAmount) > BAL_EPS) input.receivedAmount = a;
    if (paidDate !== origDate) input.receiptDate = paidDate;
    if (!Object.keys(input).length) return onClose();
    run(async () => {
      await updateReceipt(entry._id, input);
      toast(`Receipt updated — ${entry.receiptNo}`);
      onSaved();
      onClose();
    });
  };

  return (
    <Modal
      title={`Edit receipt ${entry.receiptNo}`}
      subtitle={`${entry.invoice?.invoiceNo ?? "—"} · ${customerName(entry.invoice?.customer)}`}
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
        <Field label="Received amount (AED)" hint={`Up to ${aed(max)}`}>
          <Input type="number" min={0} step="0.01" value={amount} disabled={busy} onChange={(e) => setAmount(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
