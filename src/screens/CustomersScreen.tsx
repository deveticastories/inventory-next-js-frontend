"use client";

import { useState } from "react";
import Button from "@/components/Button";
import Card from "@/components/Card";
import DataTable from "@/components/DataTable";
import { Field, Input } from "@/components/Field";
import ListBlock, { useListFilter } from "@/components/ListBlock";
import LoadState from "@/components/LoadState";
import PageHeader from "@/components/PageHeader";
import StatCard, { StatGrid } from "@/components/StatCard";
import { useUI } from "@/components/UIProvider";
import { useApi } from "@/hooks/useApi";
import { useSubmit } from "@/hooks/useSubmit";
import { getAllBillings } from "@/services/BillingServices";
import { createCustomer, getAllCustomers, getCustomerStatement, type StatementFilter } from "@/services/CustomerServices";
import { aed, BAL_EPS, fmtDate, initials } from "@/utils/Format";

const EMPTY = { name: "", contact: "", wa: "", addr: "", email: "" };

export default function CustomersScreen() {
  const { toast } = useUI();
  const { busy, run } = useSubmit();
  const q = useApi(getAllCustomers);
  const [creating, setCreating] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const [f, setF] = useState(EMPTY);
  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  if (detail) return <CustomerDetail id={detail} onBack={() => setDetail(null)} />;
  if (!q.data) return <LoadState error={q.error} onRetry={q.reload} />;
  const customers = q.data;

  const save = () => {
    const c = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.trim()])) as typeof EMPTY;
    if (!c.name || !c.contact) return toast("Name and contact are required", "error");
    run(async () => {
      await createCustomer({ name: c.name, contactNo: c.contact, whatsAppNo: c.wa, address: c.addr, email: c.email });
      setF(EMPTY);
      setCreating(false);
      toast("Customer created");
      q.reload();
    });
  };

  return (
    <>
      <PageHeader
        eyebrow="Masters"
        title="Customer Master"
        subtitle="Customers and outstanding balances"
        actions={
          !creating && (
            <Button icon="plus" onClick={() => setCreating(true)}>
              Create new
            </Button>
          )
        }
      />
      {creating && (
        <Card title="New customer" icon="contact">
          <div className="grid">
            <Field label="Name">
              <Input value={f.name} onChange={set("name")} />
            </Field>
            <Field label="Contact no">
              <Input value={f.contact} onChange={set("contact")} inputMode="tel" />
            </Field>
            <Field label="WhatsApp no">
              <Input value={f.wa} onChange={set("wa")} inputMode="tel" placeholder="+971501112222" />
            </Field>
            <Field label="Address">
              <Input value={f.addr} onChange={set("addr")} />
            </Field>
            <Field label="Email">
              <Input value={f.email} onChange={set("email")} type="email" />
            </Field>
          </div>
          <div className="actions">
            <Button icon="check" onClick={save} disabled={busy}>
              Save
            </Button>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}
      <Card title="Customers" icon="users">
        <DataTable
          head={["Sl no", "Customer name", "Contact no", "Email", "Outstanding amount"]}
          rowKeys={customers.map((c) => c._id)}
          rows={customers.map((c, i) => {
            const out = c.outstandingAmount ?? 0;
            return [
              i + 1,
              <button key="n" className="link person" onClick={() => setDetail(c._id)}>
                <span className="avatar">{initials(c.name)}</span>
                {c.name}
              </button>,
              c.contactNo,
              c.email,
              <span key="o" className={`amount ${out > BAL_EPS ? "bad" : "ok"}`}>
                {aed(out)}
              </span>,
            ];
          })}
        />
      </Card>
    </>
  );
}

const STATUS: Record<"all" | "paid" | "out", StatementFilter> = { all: "all", paid: "paid", out: "outstanding" };

function CustomerDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const filter = useListFilter<"all" | "paid" | "out">("all");
  const q = useApi(() => getCustomerStatement(id, STATUS[filter.s]), [id, filter.s]);
  // invoice count is over every invoice, not just the filtered statement
  const all = useApi(() => getAllBillings(id), [id]);
  const back = (
    <Button variant="ghost" icon="arrowLeft" onClick={onBack}>
      All customers
    </Button>
  );
  if (!q.data)
    return (
      <>
        <PageHeader eyebrow="Customer" title="Customer" actions={back} />
        <LoadState error={q.error} onRetry={q.reload} />
      </>
    );
  const { customer: c, outstandingAmount, invoices } = q.data;

  return (
    <>
      <PageHeader eyebrow="Customer" title={c.name} subtitle={`${c.contactNo} · ${c.email} · ${c.address}`} actions={back} />
      <StatGrid>
        <StatCard label="Outstanding amount" value={outstandingAmount} format={aed} icon="rupee" tone="danger" />
        <StatCard label="Invoices" value={all.data?.length ?? "—"} icon="receipt" tone="primary" />
        <StatCard label="WhatsApp" value={c.whatsAppNo || "—"} icon="phone" tone="success" />
      </StatGrid>
      <Card title="Statement" icon="file">
        <ListBlock
          title={`Customer statement — ${c.name}`}
          filter={filter}
          sorts={[
            ["all", "Show: All invoices"],
            ["paid", "Show: Paid invoices"],
            ["out", "Show: Outstanding invoices"],
          ]}
          head={["Invoice no", "Invoice date", "Invoice amount", "Received amount", "Balance amount"]}
          rowKeys={invoices.map((b) => b._id)}
          rows={invoices.map((b) => [
            <span key="n" className="mono">{b.invoiceNo}</span>,
            fmtDate(b.date),
            aed(b.netAmount),
            aed(b.receivedAmount),
            <span key="b" className="amount">{aed(b.balanceAmount)}</span>,
          ])}
        />
      </Card>
    </>
  );
}
