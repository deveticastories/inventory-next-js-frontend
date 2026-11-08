"use client";

import { useState } from "react";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import Card from "@/components/Card";
import DataTable from "@/components/DataTable";
import { Field, Input } from "@/components/Field";
import Icon from "@/components/Icon";
import LoadState from "@/components/LoadState";
import Notice from "@/components/Notice";
import PageHeader from "@/components/PageHeader";
import StatCard, { StatGrid } from "@/components/StatCard";
import { useUI } from "@/components/UIProvider";
import { useApi } from "@/hooks/useApi";
import { setSettings } from "@/hooks/useSettings";
import { useSubmit } from "@/hooks/useSubmit";
import { getLatestPackingList, getTransitDetails, transferStylesToUae } from "@/services/PackingServices";
import { updateSettings } from "@/services/SettingsServices";
import type { TransitDetails } from "@/types";
import { aed, inr, num } from "@/utils/Format";

/** Transit works on the latest packing list. */
async function loadTransit(): Promise<TransitDetails | null> {
  const pk = await getLatestPackingList();
  return pk ? await getTransitDetails(pk._id) : null;
}

export default function TransitScreen() {
  const q = useApi(loadTransit);
  if (q.data === undefined) return <LoadState error={q.error} onRetry={q.reload} />;
  return <Transit transit={q.data} reload={q.reload} />;
}

function Transit({ transit: c, reload }: { transit: TransitDetails | null; reload: () => void }) {
  const { toast, confirm } = useUI();
  const { busy, run } = useSubmit();
  const [ex, setEx] = useState("0");
  const [profit, setProfit] = useState("0");
  const [sel, setSel] = useState<string[]>([]);

  const saveRates = () => {
    const e = num(ex), p = num(profit);
    if (e <= 0) return toast("Enter a valid exchange rate", "error");
    run(async () => {
      setSettings(await updateSettings({ exchangeRate: e, profitPercent: p }));
      toast("Rates saved");
      reload();
    });
  };

  const toUae = () => {
    if (!c) return;
    if (!sel.length) return toast("Select at least one style", "error");
    confirm(
      <>
        Transfer <b>{sel.length}</b> style(s) to UAE_MAIN STORE?
      </>,
      () =>
        run(async () => {
          await transferStylesToUae(c.packingList._id, sel);
          setSel([]);
          toast("Transferred to UAE_MAIN STORE");
          reload();
        }),
    );
  };

  const movable = c ? c.styles.filter((s) => !s.moved).map((s) => s._id) : [];

  return (
    <>
      <PageHeader eyebrow="India → UAE" title="Transit" subtitle="Convert to AED, spread expenses and move to the UAE store" />
      <Card title="Rates" icon="globe">
        <div className="row">
          <Field label="Currency exchange rate (1 AED = ₹)">
            <Input type="number" step="0.01" value={ex} onChange={(e) => setEx(e.target.value)} />
          </Field>
          <Field label="Profit %">
            <Input type="number" step="0.1" value={profit} onChange={(e) => setProfit(e.target.value)} />
          </Field>
          <Button icon="check" onClick={saveRates} disabled={busy}>
            Save rates
          </Button>
        </div>
      </Card>

      {!c ? (
        <Notice tone="warn">No packing list yet. Create one in Packing List first.</Notice>
      ) : (
        <>
          <StatGrid>
            <StatCard label="Packing ID" value={c.packingList.packingId} icon="package" tone="primary" />
            <StatCard label="Additional expenses (salary + selected)" value={c.additionalExpenses} format={inr} icon="wallet" tone="warning" />
            <StatCard label="Expense recommendation / style" value={c.expenseRecommendationAED} format={aed} icon="sparkle" tone="info" />
          </StatGrid>
          <Card title={`Styles in ${c.packingList.packingId}`} icon="plane">
            <DataTable
              head={[
                <label key="all" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={movable.length > 0 && sel.length === movable.length}
                    onChange={(e) => setSel(e.target.checked ? movable : [])}
                  />
                  All
                </label>,
                "Style no",
                "Product",
                "Unit rate INR",
                "Per pc AED",
                "Qty",
                "Expense rec. (AED)",
                "Updated unit rate (AED)",
                "Status",
              ]}
              rowKeys={c.styles.map((s) => s._id)}
              rows={c.styles.map((s) => [
                <input
                  key="c"
                  type="checkbox"
                  disabled={s.moved}
                  checked={sel.includes(s._id)}
                  onChange={(e) => setSel(e.target.checked ? [...sel, s._id] : sel.filter((i) => i !== s._id))}
                />,
                <span key="s" className="mono">{s.styleNo}</span>,
                <b key="p">{s.productName}</b>,
                inr(s.unitRateINR),
                aed(s.perPcAED),
                s.qty,
                aed(s.expenseRecAED),
                <span key="u" className="amount">{aed(s.updatedUnitRateAED)}</span>,
                s.moved ? <Badge key="st" tone="ok">In UAE store</Badge> : <Badge key="st" tone="warn">Pending</Badge>,
              ])}
            />
            <div className="actions">
              <Button iconRight="arrowRight" onClick={toUae} disabled={busy}>
                Transfer selected to UAE Store
              </Button>
            </div>
            <p className="formula">
              <Icon name="info" size={14} />
              Updated unit rate = per pc AED + (additional expenses ÷ exchange rate ÷ number of styles). Selling price = updated rate + profit %.
            </p>
          </Card>
        </>
      )}
    </>
  );
}
