"use client";

import { useState } from "react";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import Card from "@/components/Card";
import DataTable, { Totals } from "@/components/DataTable";
import { Field, Input, Select } from "@/components/Field";
import LoadState from "@/components/LoadState";
import Modal from "@/components/Modal";
import PageHeader from "@/components/PageHeader";
import StatCard, { StatGrid } from "@/components/StatCard";
import { useUI } from "@/components/UIProvider";
import { useApi } from "@/hooks/useApi";
import { useSubmit } from "@/hooks/useSubmit";
import { createCreditNote, deleteCreditNote, getAllCreditNotes, updateCreditNote } from "@/services/CreditNoteServices";
import { getAllExpenses } from "@/services/ExpenseServices";
import type { CreditNote, DailyExpense } from "@/types";
import { fmtDate, inr, num, sum } from "@/utils/Format";
import { esc, printDoc } from "@/utils/Print";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Months since year 0, so two dates compare as one number. The backend buckets both ledgers by `createdAt`. */
const monthIndex = (iso?: string) => {
  const d = iso ? new Date(iso) : new Date();
  return d.getFullYear() * 12 + d.getMonth();
};

const loadLedger = () => Promise.all([getAllCreditNotes(), getAllExpenses()]);

export default function CreditNoteScreen() {
  const { toast, confirm } = useUI();
  const { busy, run } = useSubmit();
  const q = useApi(loadLedger);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [editing, setEditing] = useState<CreditNote | "new" | null>(null);

  if (!q.data) return <LoadState error={q.error} onRetry={q.reload} />;
  const [funds, expenses] = q.data;

  const selected = year * 12 + month;
  const inMonth = <T extends { createdAt?: string }>(rows: T[]) => rows.filter((r) => monthIndex(r.createdAt) === selected);
  const before = <T extends { createdAt?: string }>(rows: T[]) => rows.filter((r) => monthIndex(r.createdAt) < selected);

  // Opening = last month's closing, i.e. everything added minus everything spent before this month.
  const opening = sum(before(funds), (f) => f.amount) - sum(before(expenses), (e) => e.amount);
  const monthFunds = inMonth(funds);
  const monthExpenses = inMonth(expenses);
  const fundsAdded = sum(monthFunds, (f) => f.amount);
  const totalExpenses = sum(monthExpenses, (e) => e.amount);
  const balance = opening + fundsAdded - totalExpenses;

  const firstYear = Math.min(now.getFullYear(), ...[...funds, ...expenses].map((r) => Math.floor(monthIndex(r.createdAt) / 12)));
  const years = Array.from({ length: now.getFullYear() - firstYear + 1 }, (_, i) => String(now.getFullYear() - i));
  const period = `${MONTH_NAMES[month]} ${year}`;

  const saved = () => {
    setEditing(null);
    q.reload();
  };

  const remove = (f: CreditNote) =>
    confirm(
      <>
        Delete the fund entry of <b>{inr(f.amount)}</b>? Balances from {fmtDate(f.createdAt)} onwards will be recalculated.
      </>,
      () =>
        run(async () => {
          await deleteCreditNote(f._id);
          toast("Fund entry deleted");
          q.reload();
        }),
    );

  const download = () => {
    type Txn = { at: string; type: string; detail: string; credit: number; debit: number };
    const txns: Txn[] = [
      ...monthFunds.map((f) => ({ at: f.createdAt, type: "Fund added", detail: f.description || "—", credit: f.amount, debit: 0 })),
      ...monthExpenses.map((e: DailyExpense) => ({
        at: e.createdAt ?? e.date,
        type: "Expense",
        detail: [e.expenseType, e.description].filter(Boolean).join(" — "),
        credit: 0,
        debit: e.amount,
      })),
    ].sort((a, b) => a.at.localeCompare(b.at));

    let running = opening;
    const rows = txns.map((t) => {
      running += t.credit - t.debit;
      return [fmtDate(t.at), t.type, t.detail, t.credit ? inr(t.credit) : "", t.debit ? inr(t.debit) : "", inr(running)];
    });

    const summary: [string, number][] = [
      ["Opening balance", opening],
      ["Funds added", fundsAdded],
      ["Total expenses", totalExpenses],
      ["Available balance", balance],
      ["Closing balance", balance],
    ];
    const extra = `<table style="width:auto;min-width:320px"><tbody>${summary
      .map(([k, v]) => `<tr><th>${esc(k)}</th><td style="text-align:right">${esc(inr(v))}</td></tr>`)
      .join("")}</tbody></table><h3 style="margin:22px 0 0;font-size:14px">Transactions</h3>`;

    const ok = printDoc(`Credit note ${period}`, ["Date", "Type", "Details", "Credit", "Debit", "Balance"], rows, extra);
    if (!ok) toast("Couldn't open the print dialog", "error");
  };

  return (
    <>
      <PageHeader
        eyebrow="Finance"
        title="Credit Note"
        subtitle="Monthly petty cash — funds added, expenses and carried-forward balance"
        actions={
          <Button variant="ghost" icon="download" onClick={download}>
            Download PDF
          </Button>
        }
      />
      <Card title="Period" icon="clock">
        <div className="grid">
          <Field label="Month">
            <Select value={String(month)} onChange={(e) => setMonth(+e.target.value)} options={MONTH_NAMES.map((m, i) => ({ value: String(i), label: m }))} />
          </Field>
          <Field label="Year">
            <Select value={String(year)} onChange={(e) => setYear(+e.target.value)} options={years} />
          </Field>
        </div>
      </Card>

      <StatGrid wide>
        <StatCard label="Total expenses" value={totalExpenses} format={inr} icon="wallet" tone="danger" hint={`${monthExpenses.length} expenses in ${period}`} />
        <StatCard
          label="Balance"
          value={balance}
          format={inr}
          icon="bank"
          tone={balance < 0 ? "warning" : "success"}
          hint={`Opening ${inr(opening)} + funds ${inr(fundsAdded)} − expenses ${inr(totalExpenses)}`}
        />
      </StatGrid>

      <Card
        title="Fund entries"
        icon="rupee"
        action={
          <Button size="sm" icon="plus" onClick={() => setEditing("new")}>
            Add fund
          </Button>
        }
      >
        <DataTable
          head={["Date", "Description", "Amount", ""]}
          empty={`No funds added in ${period}`}
          rowKeys={monthFunds.map((f) => f._id)}
          rows={monthFunds.map((f) => [
            fmtDate(f.createdAt),
            f.description || <span key="d" className="muted">—</span>,
            <span key="a" className="amount ok">{inr(f.amount)}</span>,
            <div key="x" className="actions" style={{ marginTop: 0, gap: 6, flexWrap: "nowrap" }}>
              <Button variant="ghost" size="sm" icon="edit" disabled={busy} onClick={() => setEditing(f)}>
                Edit
              </Button>
              <Button variant="ghost" size="sm" icon="trash" disabled={busy} onClick={() => remove(f)}>
                Delete
              </Button>
            </div>,
          ])}
        />
        <Totals items={[["Opening balance", inr(opening)], ["Funds added", inr(fundsAdded)], ["Closing balance", inr(balance)]]} />
        {selected !== monthIndex() && (
          <div style={{ marginTop: 12 }}>
            <Badge tone="neutral" dot={false}>New funds are booked into the current month</Badge>
          </div>
        )}
      </Card>

      {editing && (
        <FundModal
          entry={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            // A new entry lands in the current month, so show that month.
            if (editing === "new") {
              setMonth(now.getMonth());
              setYear(now.getFullYear());
            }
            saved();
          }}
        />
      )}
    </>
  );
}

function FundModal({ entry, onClose, onSaved }: { entry: CreditNote | null; onClose: () => void; onSaved: () => void }) {
  const { toast } = useUI();
  const { busy, run } = useSubmit();
  const [amount, setAmount] = useState(entry ? String(entry.amount) : "");
  const [description, setDescription] = useState(entry?.description ?? "");

  const save = () => {
    const value = num(amount);
    if (value <= 0) return toast("Enter an amount greater than zero", "error");
    run(async () => {
      const input = { amount: value, description: description.trim() };
      if (entry) await updateCreditNote(entry._id, input);
      else await createCreditNote(input);
      toast(entry ? "Fund entry updated" : "Fund added");
      onSaved();
    });
  };

  return (
    <Modal
      title={entry ? "Edit fund entry" : "Add fund"}
      subtitle={entry ? `Added ${fmtDate(entry.createdAt)}` : "Booked into the current month"}
      width={520}
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
        <Field label="Amount (₹)">
          <Input type="number" min={0} step="0.01" value={amount} disabled={busy} autoFocus onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Description">
          <Input value={description} disabled={busy} onChange={(e) => setDescription(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} />
        </Field>
      </div>
    </Modal>
  );
}
