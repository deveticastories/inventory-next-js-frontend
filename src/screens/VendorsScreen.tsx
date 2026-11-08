"use client";

import { useState } from "react";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import Card from "@/components/Card";
import DataTable from "@/components/DataTable";
import { Field, Input } from "@/components/Field";
import Icon from "@/components/Icon";
import InfoItem from "@/components/InfoItem";
import LoadState from "@/components/LoadState";
import PageHeader from "@/components/PageHeader";
import { useUI } from "@/components/UIProvider";
import { useApi } from "@/hooks/useApi";
import { useSubmit } from "@/hooks/useSubmit";
import { createVendor, getAllVendors, getVendorDetails } from "@/services/VendorServices";
import { BAL_EPS, fmtDate, initials, inr } from "@/utils/Format";

const EMPTY = { name: "", contact: "", bank: "", acc: "", ifsc: "" };

export default function VendorsScreen() {
  const { toast } = useUI();
  const { busy, run } = useSubmit();
  const q = useApi(getAllVendors);
  const [creating, setCreating] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [detail, setDetail] = useState<string | null>(null);
  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  if (detail) return <VendorDetail id={detail} onBack={() => setDetail(null)} />;
  if (!q.data) return <LoadState error={q.error} onRetry={q.reload} />;
  const vendors = q.data;

  const save = () => {
    const v = Object.fromEntries(Object.entries(f).map(([k, x]) => [k, x.trim()])) as typeof EMPTY;
    if (Object.values(v).some((x) => !x)) return toast("Please fill all fields", "error");
    run(async () => {
      await createVendor({ vendorName: v.name, contactNo: v.contact, bankName: v.bank, accountNo: v.acc, ifsc: v.ifsc });
      setF(EMPTY);
      setCreating(false);
      toast("Vendor saved");
      q.reload();
    });
  };

  return (
    <>
      <PageHeader
        eyebrow="Masters"
        title="Vendors"
        subtitle="Vendor master with outstanding balances"
        actions={
          !creating && (
            <Button icon="plus" onClick={() => setCreating(true)}>
              Add vendor
            </Button>
          )
        }
      />
      {creating && (
        <Card title="Add vendor" icon="plus">
          <div className="grid">
            <Field label="Vendor name">
              <Input value={f.name} onChange={set("name")} />
            </Field>
            <Field label="Contact no">
              <Input value={f.contact} onChange={set("contact")} inputMode="tel" />
            </Field>
            <Field label="Bank name">
              <Input value={f.bank} onChange={set("bank")} />
            </Field>
            <Field label="Account no">
              <Input value={f.acc} onChange={set("acc")} />
            </Field>
            <Field label="IFSC">
              <Input value={f.ifsc} onChange={set("ifsc")} />
            </Field>
          </div>
          <div className="actions">
            <Button icon="check" onClick={save} disabled={busy}>
              Save vendor
            </Button>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <Card title="Vendor list" icon="truck">
        <DataTable
          head={["Vendor", "Contact", "Bank / Account", "Outstanding"]}
          rowKeys={vendors.map((v) => v._id)}
          rows={vendors.map((v) => {
            const out = v.outstandingAmount ?? 0;
            return [
              <button key="n" className="link person" onClick={() => setDetail(v._id)}>
                <span className="avatar">{initials(v.vendorName)}</span>
                {v.vendorName}
              </button>,
              v.contactNo,
              `${v.bankName} · ${v.accountNo}`,
              <span key="o" className={`amount ${out > BAL_EPS ? "bad" : "ok"}`}>
                {inr(out)}
              </span>,
            ];
          })}
        />
      </Card>
    </>
  );
}

function VendorDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const q = useApi(() => getVendorDetails(id), [id]);
  const back = (
    <Button variant="ghost" icon="arrowLeft" onClick={onBack}>
      All vendors
    </Button>
  );
  if (!q.data)
    return (
      <>
        <PageHeader eyebrow="Vendor" title="Vendor" actions={back} />
        <LoadState error={q.error} onRetry={q.reload} />
      </>
    );
  const { vendor: v, outstandingAmount, purchases, paymentHistory } = q.data;

  return (
    <>
      <PageHeader eyebrow="Vendor" title={v.vendorName} subtitle="Vendor details & payment history" actions={back} />
      <Card>
        <div className="info-grid">
          <InfoItem icon="phone" label="Contact" value={v.contactNo} />
          <InfoItem icon="bank" label="Bank" value={v.bankName || "—"} />
          <InfoItem icon="file" label="Account no / IFSC" value={`${v.accountNo || "—"} · ${v.ifsc || "—"}`} />
          <div className="info-item">
            <span className="card-icon" style={{ background: "var(--c-danger-soft)", color: "var(--c-danger)" }}>
              <Icon name="rupee" size={17} />
            </span>
            <div>
              <small>Outstanding amount</small>
              <b className="big">{inr(outstandingAmount)}</b>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Last purchase details" icon="cart">
        <DataTable
          head={["Invoice no", "Date", "Invoice amount", "Paid amount", "Balance amount", "Status"]}
          rowKeys={purchases.map((p) => p._id)}
          rows={purchases.map((p) => {
            const qc = p.qcStatus === "Done";
            return [
              <span key="i" className="mono">{p.invoiceNo}</span>,
              fmtDate(p.purchaseDate),
              inr(p.invoiceAmount),
              inr(p.paidAmount),
              qc && p.balanceAmount !== null ? <span key="b" className="amount">{inr(p.balanceAmount)}</span> : "—",
              qc ? <Badge key="s" tone="ok">QC done</Badge> : <Badge key="s" tone="warn">QC pending</Badge>,
            ];
          })}
        />
      </Card>

      <Card title="Payment history" icon="clock">
        <DataTable
          head={["Date", "Entry", "Reference", "Payable (+)", "Paid (−)", "Running outstanding"]}
          rows={paymentHistory.map((l) => [
            fmtDate(l.date),
            <Badge key="t" tone={l.payable ? "warn" : "ok"}>{l.type}</Badge>,
            <span key="r" className="mono">{l.reference}</span>,
            l.payable ? inr(l.payable) : "",
            l.paid ? inr(l.paid) : "",
            <span key="run" className="amount">{inr(l.runningOutstanding)}</span>,
          ])}
        />
      </Card>
    </>
  );
}
