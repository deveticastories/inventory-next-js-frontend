"use client";

import { useState } from "react";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import Card from "@/components/Card";
import DataTable from "@/components/DataTable";
import { Field, Input, PasswordInput, Select } from "@/components/Field";
import Icon from "@/components/Icon";
import LoadState from "@/components/LoadState";
import PageHeader from "@/components/PageHeader";
import { useUI } from "@/components/UIProvider";
import { useApi } from "@/hooks/useApi";
import { useSession } from "@/hooks/useSession";
import { useSubmit } from "@/hooks/useSubmit";
import { createStaff, deleteStaff, getAllStaff } from "@/services/StaffServices";
import type { StaffType, User } from "@/types";
import { initials } from "@/utils/Format";

const EMPTY = { name: "", mobile: "", emp: "", user: "", pass: "", type: "" };
const ASSIGNED: Record<string, string> = { Biller: "Assigned to UAE", Purchaser: "Assigned to India" };

export default function StaffScreen() {
  const { toast, confirm } = useUI();
  const { busy, run } = useSubmit();
  const me = useSession()?.user;
  const q = useApi(getAllStaff);
  const [creating, setCreating] = useState(false);
  const [f, setF] = useState(EMPTY);
  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  if (!q.data) return <LoadState error={q.error} onRetry={q.reload} />;
  const staff = q.data;

  const save = () => {
    const s = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.trim()])) as typeof EMPTY;
    if (Object.values(s).some((x) => !x)) return toast("Fill all staff fields", "error");
    if (staff.some((x) => x.employeeId === s.emp)) return toast("Employee ID already exists", "error");
    run(async () => {
      await createStaff({
        staffName: s.name,
        mobileNumber: s.mobile,
        employeeId: s.emp,
        email: s.user,
        password: s.pass,
        employeeType: s.type as StaffType,
      });
      setF(EMPTY);
      setCreating(false);
      toast("Staff created");
      q.reload();
    });
  };

  const remove = (s: User) =>
    confirm(
      <>
        Remove <b>{s.staffName}</b> from staff?
      </>,
      () =>
        run(async () => {
          await deleteStaff(s._id);
          toast("Staff removed");
          q.reload();
        }),
    );

  return (
    <>
      <PageHeader
        eyebrow="Masters"
        title="Staff"
        subtitle="Create and manage staff logins"
        actions={
          !creating && (
            <Button icon="plus" onClick={() => setCreating(true)}>
              Create staff
            </Button>
          )
        }
      />
      {creating && (
        <Card title="Create staff" icon="plus">
          <div className="grid">
            <Field label="Staff name">
              <Input value={f.name} onChange={set("name")} placeholder="Full name" />
            </Field>
            <Field label="Staff mobile no">
              <Input value={f.mobile} onChange={set("mobile")} inputMode="tel" placeholder="10-digit mobile" />
            </Field>
            <Field label="Employee ID">
              <Input value={f.emp} onChange={set("emp")} placeholder="EMP004" />
            </Field>
            <Field label="Email / Username">
              <Input value={f.user} onChange={set("user")} type="email" placeholder="name@stocklink.in" />
            </Field>
            <Field label="Password">
              <PasswordInput value={f.pass} onChange={set("pass")} />
            </Field>
            <Field label="Employee type">
              <Select value={f.type} onChange={set("type")} options={[{ value: "", label: "Select…" }, "Admin", "Biller", "Purchaser"]} />
              {ASSIGNED[f.type] && (
                <div key={f.type} className="assign-note">
                  <Icon name="globe" size={15} />
                  {ASSIGNED[f.type]}
                </div>
              )}
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

      <Card title="All staff" icon="users">
        <DataTable
          head={["Employee ID", "Name", "Mobile", "Email / Username", "Type", ""]}
          rowKeys={staff.map((s) => s._id)}
          rows={staff.map((s) => [
            <span className="mono" key="e">{s.employeeId}</span>,
            <span className="person" key="n">
              <span className="avatar">{initials(s.staffName)}</span>
              <b>{s.staffName}</b>
            </span>,
            s.mobileNumber,
            s.email,
            <Badge key="t" tone={s.employeeType === "Admin" ? "bad" : s.employeeType === "Biller" ? "ok" : "warn"}>
              {s.employeeType}
            </Badge>,
            <Button key="r" variant="ghost" size="sm" icon="trash" disabled={busy || s._id === me?._id} onClick={() => remove(s)}>
              Remove
            </Button>,
          ])}
        />
      </Card>
    </>
  );
}
