"use client";

import { useState } from "react";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import Card from "@/components/Card";
import DataTable, { Totals } from "@/components/DataTable";
import { Field, Input, Select } from "@/components/Field";
import LoadState from "@/components/LoadState";
import PageHeader from "@/components/PageHeader";
import StatCard, { StatGrid } from "@/components/StatCard";
import { useUI } from "@/components/UIProvider";
import { useApi } from "@/hooks/useApi";
import { useSubmit } from "@/hooks/useSubmit";
import { createExpense, getAllExpenses } from "@/services/ExpenseServices";
import type { PayMode } from "@/types";
import { fmtDate, inr, num, sum, today } from "@/utils/Format";

export default function ExpensesScreen() {
  const { toast } = useUI();
  const { busy, run } = useSubmit();
  const q = useApi(getAllExpenses);
  const [f, setF] = useState({ date: today(), type: "", mode: "Cash" as PayMode, amount: "", desc: "" });

  if (!q.data) return <LoadState error={q.error} onRetry={q.reload} />;
  const expenses = q.data;

  const save = () => {
    const amount = num(f.amount);
    if (!f.date || !f.type.trim() || amount <= 0) return toast("Enter date, type and amount", "error");
    run(async () => {
      await createExpense({ date: f.date, expenseType: f.type.trim(), paymentType: f.mode, amount, description: f.desc.trim() });
      setF({ ...f, type: "", amount: "", desc: "" });
      toast("Expense saved");
      q.reload();
    });
  };

  const isOpen = (packingId: string) => packingId === "Open";
  const open = expenses.filter((e) => isOpen(e.packingId));
  const total = sum(expenses, (e) => e.amount);

  return (
    <>
      <PageHeader eyebrow="Finance" title="Daily Expenses" subtitle="Record day-to-day expenses (attach them to packing lists later)" />
      <StatGrid>
        <StatCard label="Total booked" value={total} format={inr} icon="wallet" tone="primary" />
        <StatCard label="Open (not attached)" value={sum(open, (e) => e.amount)} format={inr} icon="clock" tone="warning" hint={`${open.length} entries`} />
        <StatCard label="Attached to packing" value={total - sum(open, (e) => e.amount)} format={inr} icon="package" tone="success" />
      </StatGrid>
      <Card title="New expense" icon="plus">
        <div className="grid">
          <Field label="Date">
            <Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
          </Field>
          <Field label="Expense type">
            <Input value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} placeholder="Freight, Labour…" />
          </Field>
          <Field label="Payment mode">
            <Select value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value as PayMode })} options={["Cash", "Upi", "Account"]} />
          </Field>
          <Field label="Amount (₹)">
            <Input type="number" min={0} step="0.01" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
          </Field>
          <Field label="Description">
            <Input value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} onKeyDown={(e) => e.key === "Enter" && save()} />
          </Field>
        </div>
        <div className="actions">
          <Button icon="check" onClick={save} disabled={busy}>
            OK
          </Button>
        </div>
      </Card>
      <Card title="Expenses" icon="wallet">
        <DataTable
          head={["Date", "Type", "Mode", "Amount", "Description", "Packing ID"]}
          rowKeys={expenses.map((e) => e._id)}
          rows={expenses.map((e) => [
            fmtDate(e.date),
            <b key="t">{e.expenseType}</b>,
            <Badge key="m" tone="neutral" dot={false}>{e.paymentType}</Badge>,
            <span key="a" className="amount">{inr(e.amount)}</span>,
            e.description,
            isOpen(e.packingId) ? <Badge key="p" tone="ok">Open</Badge> : <Badge key="p" tone="warn">{e.packingId}</Badge>,
          ])}
        />
        <Totals items={[["Total", inr(total)]]} />
      </Card>
    </>
  );
}
