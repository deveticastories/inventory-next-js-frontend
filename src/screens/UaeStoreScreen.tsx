"use client";

import { useState } from "react";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Combo from "@/components/Combo";
import DataTable from "@/components/DataTable";
import { Field, Input, Select } from "@/components/Field";
import ListBlock, { useListFilter } from "@/components/ListBlock";
import LoadState from "@/components/LoadState";
import Modal from "@/components/Modal";
import Notice from "@/components/Notice";
import PageHeader from "@/components/PageHeader";
import StatCard, { StatGrid } from "@/components/StatCard";
import Tabs from "@/components/Tabs";
import { useUI } from "@/components/UIProvider";
import { useApi } from "@/hooks/useApi";
import { useSubmit } from "@/hooks/useSubmit";
import { getAllBillings } from "@/services/BillingServices";
import { createReturn, getReturnable, getUaeMainStock, getUaeReturnStock, moveReturnToMain } from "@/services/UaeStoreServices";
import type { Returnable, ReturnReason, ReturnType, UaeReturnRow } from "@/types";
import { billingOptions } from "@/utils/Display";
import { aed, byDateDesc, fmtDate, hit, num } from "@/utils/Format";

type Sort = "date" | "style" | "product";
const cmp =
  <T extends { styleNo: string; productName: string }>(s: Sort, date: (x: T) => string) =>
  (a: T, b: T) =>
    s === "style" ? a.styleNo.localeCompare(b.styleNo) : s === "product" ? a.productName.localeCompare(b.productName) : byDateDesc(date(a), date(b));

export default function UaeStoreScreen() {
  const [tab, setTab] = useState<"main" | "ret">("main");
  const [modal, setModal] = useState<"return" | "transfer" | null>(null);
  const mainF = useListFilter<Sort>("date");
  const retF = useListFilter<Sort>("date");
  const q = useApi(() => Promise.all([getUaeMainStock(), getUaeReturnStock()]));

  if (!q.data) return <LoadState error={q.error} onRetry={q.reload} />;
  const [main, ret] = q.data;

  return (
    <>
      <PageHeader
        eyebrow="UAE"
        title="UAE Store Stock"
        subtitle="UAE_MAIN STORE and UAE_RETURN STORE"
        actions={
          tab === "ret" && (
            <>
              <Button icon="plus" onClick={() => setModal("return")}>
                Create return
              </Button>
              <Button variant="ghost" icon="swap" onClick={() => setModal("transfer")}>
                Transfer to UAE main store
              </Button>
            </>
          )
        }
      />
      <Tabs
        tabs={[
          { value: "main", label: "UAE_MAIN STORE" },
          { value: "ret", label: "UAE_RETURN STORE" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "main" ? (
        <div key="main" className="reveal">
          <StatGrid>
            <StatCard label="Stock volume (qty)" value={main.summary.stockVolume ?? 0} icon="layers" tone="primary" />
            <StatCard label="Stock value (at cost)" value={main.summary.stockValue ?? 0} format={aed} icon="warehouse" tone="info" />
          </StatGrid>
          <Card>
            <ListBlock
              title="UAE_MAIN STORE Stock"
              filter={mainF}
              searchPlaceholder="Search style no / product"
              sorts={[
                ["date", "Sort: Transit date"],
                ["style", "Sort: Style no"],
                ["product", "Sort: Product name"],
              ]}
              head={["Style no", "Product name", "Transit date", "Avl qty", "Unit selling price"]}
              rows={main.data
                .filter((u) => hit(mainF.q, u.styleNo, u.productName))
                .sort(cmp(mainF.s, (u) => u.transitDate))
                .map((u) => [
                  <span key="s" className="mono">{u.styleNo}</span>,
                  <b key="p">{u.productName}</b>,
                  fmtDate(u.transitDate),
                  u.qty,
                  <span key="pr" className="amount ok">{aed(u.sellingPriceAED)}</span>,
                ])}
            />
          </Card>
        </div>
      ) : (
        <div key="ret" className="reveal">
          <StatGrid>
            <StatCard label="Stock volume (qty)" value={ret.summary.stockVolume ?? 0} icon="layers" tone="warning" />
            <StatCard label="Stock value (returned)" value={ret.summary.stockValue ?? 0} format={aed} icon="refresh" tone="danger" />
          </StatGrid>
          <Card>
            <ListBlock
              title="UAE_RETURN STORE"
              filter={retF}
              searchPlaceholder="Search style no / product"
              sorts={[
                ["date", "Sort: Returned date"],
                ["style", "Sort: Style no"],
                ["product", "Sort: Product name"],
              ]}
              empty="No returns yet"
              head={["Invoice no", "Style no", "Product", "Returned qty", "Reason", "Invoice value", "Updated invoice value", "In store"]}
              rows={ret.data
                .filter((x) => hit(retF.q, x.styleNo, x.productName))
                .sort(cmp(retF.s, (x) => x.returnDate))
                .map((x) => [
                  <span key="i" className="mono">{x.invoiceNo}</span>,
                  <span key="s" className="mono">{x.styleNo}</span>,
                  <b key="p">{x.productName}</b>,
                  x.returnedQty,
                  <Badge key="r" tone={x.reason === "Damage" ? "bad" : "warn"}>{x.reason}</Badge>,
                  aed(x.invoiceValue),
                  aed(x.updatedInvoiceValue),
                  x.inStore,
                ])}
            />
          </Card>
        </div>
      )}

      {modal === "return" && <ReturnModal onClose={() => setModal(null)} onDone={q.reload} />}
      {modal === "transfer" && <TransferMainModal rows={ret.data} onClose={() => setModal(null)} onDone={q.reload} />}
    </>
  );
}

function TransferMainModal({ rows, onClose, onDone }: { rows: UaeReturnRow[]; onClose: () => void; onDone: () => void }) {
  const { toast } = useUI();
  const { busy, run } = useSubmit();
  const [id, setId] = useState("");
  const [qty, setQty] = useState("");
  const x = rows.find((z) => z._id === id);

  const submit = () => {
    const q = num(qty);
    if (!x) return toast("Select a style", "error");
    if (q <= 0 || q > x.inStore || !Number.isInteger(q)) return toast(`Qty must be 1 – ${x.inStore}`, "error");
    run(async () => {
      await moveReturnToMain({ returnId: x.returnId, returnProduct: x._id, qty: q });
      toast("Moved to UAE_MAIN STORE");
      onDone();
      onClose();
    });
  };

  return (
    <Modal
      title="Transfer to UAE_MAIN STORE"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button icon="swap" onClick={submit} disabled={busy}>
            Submit
          </Button>
        </>
      }
    >
      <Notice>Damaged returns are not listed.</Notice>
      <div className="grid">
        <Field label="Style no">
          <Combo
            options={rows
              .filter((r) => r.inStore > 0 && r.reason !== "Damage")
              .map((r) => ({ value: r._id, label: `${r.styleNo} — ${r.productName} (qty ${r.inStore})` }))}
            value={id}
            onChange={(v) => {
              setId(v);
              setQty(String(rows.find((z) => z._id === v)?.inStore ?? ""));
            }}
            placeholder="Search style…"
          />
        </Field>
        <Field label="Qty">
          <Input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

function ReturnModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { toast } = useUI();
  const { busy, run } = useSubmit();
  const [inv, setInv] = useState("");
  const [type, setType] = useState<ReturnType>("Fully");
  const [reason, setReason] = useState<ReturnReason>("Damage");
  const [picked, setPicked] = useState<number[]>([]);
  const [qtys, setQtys] = useState<Record<number, string>>({});
  const full = type === "Fully";

  const bills = useApi(() => getAllBillings());
  const rq = useApi<Returnable | null>(() => (inv ? getReturnable(inv) : Promise.resolve(null)), [inv]);
  const rows = rq.data && rq.data.invoice._id === inv ? rq.data.products : [];

  const submit = () => {
    if (!inv) return toast("Select an invoice", "error");
    const chosen = full ? rows.map((_, i) => i).filter((i) => rows[i]!.returnableQty > 0) : picked;
    const picks: { billingProduct: string; qty: number }[] = [];
    for (const i of chosen) {
      const r = rows[i]!, q = full ? r.returnableQty : num(qtys[i] ?? "");
      if (q > r.returnableQty) return toast("Return qty exceeds returnable qty", "error");
      if (!Number.isInteger(q)) return toast("Return qty must be a whole number", "error");
      if (q > 0) picks.push({ billingProduct: r.billingProduct, qty: q });
    }
    if (!picks.length) return toast("Select products and enter return qty", "error");
    run(async () => {
      await createReturn({ invoice: inv, returnType: type, reason, ...(!full && { products: picks }) });
      toast("Return recorded");
      onDone();
      onClose();
    });
  };

  return (
    <Modal
      title="Create return"
      subtitle="Record a customer return against an invoice"
      onClose={onClose}
      width={780}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button icon="check" onClick={submit} disabled={busy}>
            Submit
          </Button>
        </>
      }
    >
      {bills.error && <LoadState error={bills.error} onRetry={bills.reload} />}
      <div className="grid">
        <Field label="Select invoice">
          <Combo
            options={billingOptions(bills.data ?? [])}
            value={inv}
            onChange={(v) => {
              setInv(v);
              setPicked([]);
              setQtys({});
            }}
            placeholder={bills.data ? "Search invoice…" : "Loading invoices…"}
          />
        </Field>
        <Field label="Return type">
          <Select value={type} onChange={(e) => setType(e.target.value as ReturnType)} options={["Fully", "Partial"]} />
        </Field>
        <Field label="Reason">
          <Select value={reason} onChange={(e) => setReason(e.target.value as ReturnReason)} options={["Damage", "Size issue", "Other"]} />
        </Field>
      </div>
      {inv && rq.error && <LoadState error={rq.error} onRetry={rq.reload} />}
      {rows.length > 0 && (
        <div className="mt">
          <DataTable
            head={["", "Style no", "Product", "Invoiced", "Returnable", "Return qty"]}
            rowKeys={rows.map((r) => r.billingProduct)}
            rows={rows.map((r, i) => [
              <input
                key="c"
                type="checkbox"
                disabled={r.returnableQty <= 0 || full}
                checked={full ? r.returnableQty > 0 : picked.includes(i)}
                onChange={(e) => setPicked(e.target.checked ? [...picked, i] : picked.filter((x) => x !== i))}
              />,
              <span key="s" className="mono">{r.styleNo}</span>,
              r.productName,
              r.invoicedQty,
              r.returnableQty,
              <Input
                key="q"
                className="sm"
                type="number"
                min={0}
                max={r.returnableQty}
                readOnly={full || r.returnableQty <= 0}
                value={full ? String(r.returnableQty) : (qtys[i] ?? "")}
                onChange={(e) => setQtys({ ...qtys, [i]: e.target.value })}
              />,
            ])}
          />
        </div>
      )}
    </Modal>
  );
}
