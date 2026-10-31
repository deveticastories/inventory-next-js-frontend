"use client";

import Link from "next/link";
import Card from "@/components/Card";
import FlowSteps, { type FlowStep } from "@/components/FlowSteps";
import Icon from "@/components/Icon";
import LoadState from "@/components/LoadState";
import StatCard, { StatGrid } from "@/components/StatCard";
import { ENDPOINTS } from "@/constants/ApiConstants";
import { useApi } from "@/hooks/useApi";
import { useSession } from "@/hooks/useSession";
import { getTotal } from "@/services/ApiClient";
import { getPayableInvoices } from "@/services/PaymentServices";
import { getDashboard } from "@/services/ReportServices";
import { aed, inr } from "@/utils/Format";

const FLOW: FlowStep[] = [
  { label: "Vendor", href: "/vendors", icon: "truck" },
  { label: "Purchase invoice", href: "/purchase", icon: "cart" },
  { label: "Quality check", href: "/quality-check", icon: "shield" },
  { label: "TRP Main store", href: "/ind-store", icon: "box" },
  { label: "Packing list", href: "/packing", icon: "package" },
  { label: "Transit", href: "/transit", icon: "plane" },
  { label: "UAE Main store", href: "/uae-store", icon: "warehouse" },
  { label: "Billing", href: "/billing", icon: "receipt" },
  { label: "Receipt", href: "/receipts", icon: "arrowDown" },
];

export default function DashboardScreen() {
  const name = useSession()?.user.staffName ?? "";
  const q = useApi(() =>
    Promise.all([
      getDashboard(),
      getPayableInvoices(),
      getTotal(ENDPOINTS.vendors.root),
      getTotal(ENDPOINTS.customers.root),
      getTotal(ENDPOINTS.stores.root),
    ]),
  );
  if (!q.data) return <LoadState error={q.error} onRetry={q.reload} />;
  const [{ stats, pendingActions: pa }, payable, vendors, customers, stores] = q.data;

  const pending = [
    { label: "Purchase invoices waiting for QC", count: pa.purchaseInvoicesWaitingForQC, href: "/quality-check", go: "Quality Check" },
    { label: "Vendor invoices with balance", count: payable.length, href: "/payments", go: "Payment Entry" },
    { label: "Customer invoices with balance", count: pa.customerInvoicesWithBalance, href: "/receipts", go: "Receipt Entry" },
    { label: "Expenses not attached to a packing list", count: pa.expensesNotAttachedToPackingList, href: "/packing", go: "Packing List" },
  ];

  return (
    <>
      <section className="hero">
        <div className="hero-row">
          <div>
            <div className="eyebrow" style={{ color: "#C7D2FE", background: "none", WebkitTextFillColor: "#C7D2FE" }}>
              Overview
            </div>
            <h1>Welcome back, {name.split(" ")[0]} 👋</h1>
            <p>Quick view of purchasing, stock, sales and cash across your India and UAE stores.</p>
          </div>
          <div className="hero-meta">
            <div className="hero-chip">
              <small>Vendors</small>
              <b>{vendors}</b>
            </div>
            <div className="hero-chip">
              <small>Customers</small>
              <b>{customers}</b>
            </div>
            <div className="hero-chip">
              <small>Stores</small>
              <b>{stores}</b>
            </div>
          </div>
        </div>
      </section>

      <StatGrid wide>
        <StatCard label="Vendor outstanding" value={stats.vendorOutstanding} format={inr} icon="truck" tone="danger" />
        <StatCard label="Customer outstanding" value={stats.customerOutstanding} format={aed} icon="contact" tone="warning" />
        <StatCard label="IND main stock value" value={stats.indMainStockValue} format={inr} icon="box" tone="primary" />
        <StatCard label="UAE main stock value" value={stats.uaeMainStockValue} format={aed} icon="warehouse" tone="info" />
        <StatCard label="Sales (net)" value={stats.netSales} format={aed} icon="trend" tone="success" />
        <StatCard label="Expenses booked" value={stats.expensesBooked} format={inr} icon="wallet" tone="primary" />
      </StatGrid>

      <Card title="Workflow" icon="sparkle">
        <FlowSteps steps={FLOW} />
      </Card>

      <Card title="Pending actions" icon="clock">
        <div className="pending-grid stagger">
          {pending.map((p) => (
            <Link key={p.label} href={p.href} className="pending">
              <span className={`pending-count ${p.count ? "" : "zero"}`}>{p.count}</span>
              <div>
                <b>{p.label}</b>
                <small>
                  Go to {p.go} <Icon name="arrowRight" size={12} stroke={2.6} />
                </small>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </>
  );
}
