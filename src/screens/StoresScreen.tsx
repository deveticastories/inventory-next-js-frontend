"use client";

import { useState } from "react";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import Card from "@/components/Card";
import DataTable from "@/components/DataTable";
import { Field, Input, Select } from "@/components/Field";
import LoadState from "@/components/LoadState";
import PageHeader from "@/components/PageHeader";
import { useUI } from "@/components/UIProvider";
import { useApi } from "@/hooks/useApi";
import { useSubmit } from "@/hooks/useSubmit";
import { getAllStaff } from "@/services/StaffServices";
import { createStore, getAllStores } from "@/services/StoreServices";
import type { Store, StoreLocation, User } from "@/types";
import { staffName } from "@/utils/Display";

const EMPTY = { name: "", loc: "", contact: "", inch: "" };

const inChargeName = (t: Store, staff: User[]) =>
  staffName(typeof t.inCharge === "object" ? t.inCharge : staff.find((s) => s._id === t.inCharge));

export default function StoresScreen() {
  const { toast } = useUI();
  const { busy, run } = useSubmit();
  const q = useApi(() => Promise.all([getAllStores(), getAllStaff()]));
  const [creating, setCreating] = useState(false);
  const [f, setF] = useState(EMPTY);
  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  if (!q.data) return <LoadState error={q.error} onRetry={q.reload} />;
  const [stores, staff] = q.data;
  const inCharge = staff.filter((s) => s.employeeType !== "Admin");

  const save = () => {
    const t = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.trim()])) as typeof EMPTY;
    if (!t.name || !t.loc || !t.contact || !t.inch) return toast("Fill all store fields", "error");
    run(async () => {
      await createStore({ name: t.name, location: t.loc as StoreLocation, contactNumber: t.contact, inCharge: t.inch });
      setF(EMPTY);
      setCreating(false);
      toast("Store created");
      q.reload();
    });
  };

  return (
    <>
      <PageHeader
        eyebrow="Masters"
        title="Stores"
        subtitle="Create stores in India or UAE"
        actions={
          !creating && (
            <Button icon="plus" onClick={() => setCreating(true)}>
              Create store
            </Button>
          )
        }
      />
      {creating && (
        <Card title="Create store" icon="plus">
          <div className="grid">
            <Field label="Store name">
              <Input value={f.name} onChange={set("name")} placeholder="e.g. TRP_EXPORT STORE" />
            </Field>
            <Field label="Store location">
              <Select value={f.loc} onChange={set("loc")} options={[{ value: "", label: "Select…" }, "IND", "UAE"]} />
            </Field>
            <Field label="Contact no">
              <Input value={f.contact} onChange={set("contact")} inputMode="tel" />
            </Field>
            <Field label="In charge (Biller / Purchaser)">
              <Select
                value={f.inch}
                onChange={set("inch")}
                options={[{ value: "", label: "Select…" }, ...inCharge.map((s) => ({ value: s._id, label: `${s.staffName} — ${s.employeeType}` }))]}
              />
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

      <Card title="Stores" icon="store">
        <DataTable
          head={["Store", "Location", "Contact", "In charge"]}
          rowKeys={stores.map((t) => t._id)}
          rows={stores.map((t) => [
            <b key="n">{t.name}</b>,
            <Badge key="l" tone={t.location === "IND" ? "warn" : "ok"}>
              {t.location === "IND" ? "🇮🇳 IND" : "🇦🇪 UAE"}
            </Badge>,
            t.contactNumber,
            inChargeName(t, staff),
          ])}
        />
      </Card>
    </>
  );
}
