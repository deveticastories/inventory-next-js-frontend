"use client";

import { useState } from "react";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Combo from "@/components/Combo";
import DataTable from "@/components/DataTable";
import { Field, Input } from "@/components/Field";
import LoadState from "@/components/LoadState";
import Notice from "@/components/Notice";
import PageHeader from "@/components/PageHeader";
import { useUI } from "@/components/UIProvider";
import { useApi } from "@/hooks/useApi";
import { useSubmit } from "@/hooks/useSubmit";
import { getAllPurchaseEntries } from "@/services/PurchaseServices";
import { getQualityCheckByPurchase, submitQualityCheck } from "@/services/QualityCheckServices";
import type { QualityCheck } from "@/types";
import { purchaseOptions, staffName, vendorName } from "@/utils/Display";
import { num } from "@/utils/Format";

export default function QualityCheckScreen() {
  const { toast, confirm } = useUI();
  const { busy, run } = useSubmit();
  const q = useApi(getAllPurchaseEntries);
  const [inv, setInv] = useState("");
  const [damage, setDamage] = useState<Record<string, string>>({});
  // rows are confirmed one by one here, then sent to the server together
  const [locked, setLocked] = useState<string[]>([]);
  const [checkedByName, setCheckedByName] = useState("");

  const p = q.data?.find((x) => x._id === inv);
  const done = p?.qcStatus === "Done";
  const qc = useApi<QualityCheck | null>(() => (p && done ? getQualityCheckByPurchase(p._id) : Promise.resolve(null)), [p?._id, done]);

  if (!q.data) return <LoadState error={q.error} onRetry={q.reload} />;
  // ignore a QC record still on screen from the previously picked invoice
  const qcData = qc.data && qc.data.purchaseEntry._id === p?._id ? qc.data : null;

  const pick = (v: string) => {
    setInv(v);
    setDamage({});
    setLocked([]);
    setCheckedByName("");
  };

  const damageOf = (id: string) => {
    if (done) return qcData?.damagedProducts.find((d) => d.purchaseEntryProduct === id)?.qty ?? 0;
    return num(damage[id] ?? "0");
  };

  const submitRow = (id: string) => {
    const i = p!.products.find((x) => x._id === id)!;
    const d = damageOf(id);
    if (d < 0 || d > i.purchaseQty || !Number.isInteger(d)) return toast(`Damage qty must be a whole number between 0 and ${i.purchaseQty}`, "error");
    confirm(
      <>
        Submit <b>{d}</b> damaged pcs for <b>{i.productName}</b>? This cannot be changed later.
      </>,
      () => {
        setLocked((l) => [...l, id]);
        toast("Row submitted");
      },
    );
  };

  const final = () => {
    if (p!.products.some((i) => !locked.includes(i._id))) return toast("Submit every product row first", "error");
    const by = checkedByName.trim();
    if (!by) return toast('Enter "Checked by"', "error");
    confirm("Complete quality check? Stock and vendor payable will be updated.", () =>
      run(async () => {
        await submitQualityCheck({
          purchaseEntry: p!._id,
          products: p!.products.map((i) => ({ purchaseEntryProduct: i._id, damageQty: damageOf(i._id) })),
          checkedByName: by,
        });
        toast("QC completed — payable posted to vendor history");
        q.reload();
      }),
    );
  };

  const lockedCount = done ? (p?.products.length ?? 0) : locked.length;
  const checkedBy = done ? qcData?.checkedByName || staffName(qcData?.checkedBy) : checkedByName;

  return (
    <>
      <PageHeader eyebrow="Purchase" title="Quality Check" subtitle="Record damaged quantity per product" />
      <Card title="Select invoice" icon="search">
        <div className="row">
          <Field label="Purchase invoice" style={{ maxWidth: 460 }}>
            <Combo options={purchaseOptions(q.data)} value={inv} onChange={pick} placeholder="Search invoice…" />
          </Field>
          {p && (
            <Badge tone={done ? "ok" : "warn"}>
              {done ? "QC completed" : `${lockedCount} / ${p.products.length} rows submitted`}
            </Badge>
          )}
        </div>
      </Card>

      {p && (
        <Card title={`Products in ${p.invoiceNo}`} icon="shield" key={p._id}>
          {done && (
            <Notice tone="ok">
              Quality check completed by <b>{checkedBy}</b>. Records are locked.
            </Notice>
          )}
          <DataTable
            head={["Invoice no", "Vendor", "Product", "Total qty", "Damage qty", "Action"]}
            rowKeys={p.products.map((i) => i._id)}
            rows={p.products.map((i) => {
              const isLocked = done || locked.includes(i._id);
              return [
                <span key="i" className="mono">{p.invoiceNo}</span>,
                vendorName(p.vendor),
                <b key="n">{i.productName}</b>,
                i.purchaseQty,
                <Input
                  key="d"
                  className="sm"
                  type="number"
                  min={0}
                  max={i.purchaseQty}
                  disabled={isLocked}
                  value={done ? String(damageOf(i._id)) : (damage[i._id] ?? "0")}
                  onChange={(e) => setDamage({ ...damage, [i._id]: e.target.value })}
                />,
                isLocked ? (
                  <Badge key="a" tone="ok">Submitted ✓</Badge>
                ) : (
                  <Button key="a" size="sm" onClick={() => submitRow(i._id)}>
                    Submit
                  </Button>
                ),
              ];
            })}
          />
          <div className="actions">
            <Field label="Checked by" style={{ width: 300 }}>
              <Input
                value={checkedBy}
                disabled={done}
                placeholder="Name of the person who checked"
                onChange={(e) => setCheckedByName(e.target.value)}
              />
            </Field>
            <Button variant="success" icon="shield" disabled={done || busy} onClick={final} style={{ alignSelf: "flex-end" }}>
              Submit quality check
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}
