"use client";

import { useState } from "react";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Combo from "@/components/Combo";
import DataTable from "@/components/DataTable";
import { Field, Input, Value } from "@/components/Field";
import LoadState from "@/components/LoadState";
import PageHeader from "@/components/PageHeader";
import { useUI } from "@/components/UIProvider";
import { useApi } from "@/hooks/useApi";
import { useSubmit } from "@/hooks/useSubmit";
import { getAllExpenses } from "@/services/ExpenseServices";
import { createPackingList, getAllPackingLists, getPackableProducts, getPackableVendors } from "@/services/PackingServices";
import type { PackingList, PackingVendorAvailability } from "@/types";
import { fmtDate, inr, nextCode, num, sum, today } from "@/utils/Format";

type Staged = { style: string; product: string; vendor: string; vendorName: string; qty: number };

export default function PackingListScreen() {
  const [open, setOpen] = useState(false);
  const q = useApi(getAllPackingLists);

  if (!q.data) return <LoadState error={q.error} onRetry={q.reload} />;
  const lists = q.data;

  return (
    <>
      <PageHeader
        eyebrow="India"
        title="Packing List"
        subtitle="Pack styles from TRP_MAIN STORE for shipment to UAE"
        actions={
          !open && (
            <Button icon="plus" onClick={() => setOpen(true)}>
              Add new
            </Button>
          )
        }
      />
      {open && (
        <PackingForm
          lists={lists}
          onCancel={() => setOpen(false)}
          onCreated={() => {
            setOpen(false);
            q.reload();
          }}
        />
      )}
      <Card title="Packing lists" icon="package">
        <DataTable
          head={["Packing ID", "Date", "Styles", "Total qty", "Salary", "Expenses attached", "Status"]}
          empty="No packing lists yet"
          rowKeys={lists.map((k) => k._id)}
          rows={lists.map((k) => [
            <span key="i" className="mono">{k.packingId}</span>,
            fmtDate(k.packingDate),
            k.styles.map((l) => l.styleNo).join(", "),
            k.totalQty,
            inr(k.salary),
            inr(k.totalExpense),
            k.packingListStatus === "Completed" ? <Badge key="s" tone="ok">Transferred</Badge> : <Badge key="s" tone="warn">In transit queue</Badge>,
          ])}
        />
      </Card>
    </>
  );
}

function PackingForm({ lists, onCancel, onCreated }: { lists: PackingList[]; onCancel: () => void; onCreated: () => void }) {
  const { toast } = useUI();
  const { busy, run } = useSubmit();
  const [date, setDate] = useState(today);
  const [salary, setSalary] = useState("");
  const [exp, setExp] = useState<string[]>([]);
  const [lines, setLines] = useState<Staged[]>([]);
  const [style, setStyle] = useState("");
  const [prod, setProd] = useState("");
  const [ven, setVen] = useState("");
  const [qty, setQty] = useState("");

  const base = useApi(() => Promise.all([getAllExpenses(), getPackableProducts()]));
  const vq = useApi<PackingVendorAvailability[]>(() => (prod ? getPackableVendors(prod) : Promise.resolve([])), [prod]);

  if (!base.data) return <LoadState error={base.error} onRetry={base.reload} />;
  const [expenses, products] = base.data;

  const vendors = prod ? (vq.data ?? []) : [];
  const staged = (n: string, v: string) => sum(lines.filter((l) => l.product === n && l.vendor === v), (l) => l.qty);
  const stock = vendors.find((v) => v.vendor._id === ven);
  const avail = prod && stock ? stock.availableQty - staged(prod, ven) : null;
  const usedStyles = new Set(lists.flatMap((p) => p.styles.map((s) => s.styleNo)));

  const add = () => {
    const st = style.trim(), q = num(qty);
    if (!st || !prod || !ven || q <= 0) return toast("Fill style, product, vendor and qty", "error");
    if (!Number.isInteger(q)) return toast("Qty must be a whole number", "error");
    if (lines.some((l) => l.style === st) || usedStyles.has(st)) return toast("Style no already used", "error");
    if (q > (avail ?? 0)) return toast(`Only ${avail} available`, "error");
    setLines([...lines, { style: st, product: prod, vendor: ven, vendorName: stock!.vendor.vendorName, qty: q }]);
    setStyle("");
    setQty("");
  };

  const create = () => {
    if (!lines.length) return toast("Add at least one style", "error");
    run(async () => {
      const pk = await createPackingList({
        packingDate: date,
        salary: num(salary),
        dailyExpenses: exp,
        styles: lines.map((l) => ({ styleNo: l.style, productName: l.product, vendor: l.vendor, qty: l.qty })),
      });
      toast(`${pk.packingId} created — go to Transit`);
      onCreated();
    });
  };

  return (
    <>
      <Card title="New packing list" icon="package">
        <div className="grid">
          <Field label="Packing ID (auto)">
            <Input readOnly value={nextCode("PK-", lists.map((l) => l.packingId))} />
          </Field>
          <Field label="Packing date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Salary (₹)">
            <Input type="number" min={0} value={salary} onChange={(e) => setSalary(e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card title="Attach expenses (from Daily Expenses)" icon="wallet">
        <DataTable
          head={["", "Date", "Expense type", "Mode", "Amount", "Description"]}
          empty="No expenses recorded"
          rowKeys={expenses.map((e) => e._id)}
          rows={expenses.map((e) => {
            const used = e.packingId !== "Open";
            return [
              <input
                key="c"
                type="checkbox"
                disabled={used}
                checked={exp.includes(e._id)}
                onChange={(ev) => setExp(ev.target.checked ? [...exp, e._id] : exp.filter((x) => x !== e._id))}
              />,
              fmtDate(e.date),
              e.expenseType,
              e.paymentType,
              inr(e.amount),
              <span key="d">
                {e.description} {used && <Badge tone="warn">Used in {e.packingId}</Badge>}
              </span>,
            ];
          })}
        />
      </Card>

      <Card title="Add styles" icon="layers">
        <div className="row">
          <Field label="Style no">
            <Input value={style} onChange={(e) => setStyle(e.target.value)} placeholder="e.g. ST-201" />
          </Field>
          <Field label="Product name">
            <Combo
              options={products.map((p) => ({ value: p.productName, label: p.productName }))}
              value={prod}
              onChange={(v) => {
                setProd(v);
                setVen("");
              }}
              placeholder="Search product…"
            />
          </Field>
          <Field label="Vendor name">
            <Combo
              key={prod}
              options={vendors.map((v) => ({ value: v.vendor._id, label: v.vendor.vendorName }))}
              value={ven}
              onChange={setVen}
              placeholder="Vendors with this product…"
            />
          </Field>
          <Field label="Available qty" style={{ flex: "none", width: 130 }}>
            <Value strong>{avail ?? "—"}</Value>
          </Field>
          <Field label="Enter qty" style={{ flex: "none", width: 120 }}>
            <Input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
          </Field>
          <Button icon="check" onClick={add}>
            Okay
          </Button>
        </div>
        <div className="mt">
          <DataTable
            head={["Date", "Style no", "Product", "Vendor", "Qty", ""]}
            empty="No styles added yet"
            rowKeys={lines.map((l) => l.style)}
            rows={lines.map((l, x) => [
              fmtDate(date),
              <span key="s" className="mono">{l.style}</span>,
              <b key="p">{l.product}</b>,
              l.vendorName,
              l.qty,
              <Button key="r" variant="ghost" size="sm" icon="trash" onClick={() => setLines(lines.filter((_, j) => j !== x))}>
                Remove
              </Button>,
            ])}
          />
        </div>
        <div className="actions">
          <Button variant="success" icon="package" onClick={create} disabled={busy}>
            Add — create packing list
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </Card>
    </>
  );
}
