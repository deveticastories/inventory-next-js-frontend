import type { IconName } from "@/components/Icon";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  { title: "Overview", items: [{ href: "/", label: "Dashboard", icon: "dashboard" }] },
  {
    title: "Masters",
    items: [
      { href: "/staff", label: "Staff", icon: "users" },
      { href: "/vendors", label: "Vendors", icon: "truck" },
      { href: "/stores", label: "Stores", icon: "store" },
      { href: "/customers", label: "Customer Master", icon: "contact" },
    ],
  },
  {
    title: "Purchase",
    items: [
      { href: "/purchase", label: "Item Master", icon: "cart" },
      { href: "/quality-check", label: "Quality Check", icon: "shield" },
      { href: "/purchase-data", label: "Purchase Data", icon: "file" },
    ],
  },
  {
    title: "India",
    items: [
      { href: "/ind-store", label: "IND Store Stock", icon: "box" },
      { href: "/packing", label: "Packing List", icon: "package" },
      { href: "/transit", label: "Transit", icon: "plane" },
    ],
  },
  {
    title: "UAE",
    items: [
      { href: "/uae-store", label: "UAE Store Stock", icon: "warehouse" },
      { href: "/billing", label: "Billing", icon: "receipt" },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/expenses", label: "Daily Expenses", icon: "wallet" },
      { href: "/payments", label: "Payment Entry", icon: "arrowUp" },
      { href: "/receipts", label: "Receipt Entry", icon: "arrowDown" },
    ],
  },
  { title: "Analysis", items: [{ href: "/reports", label: "Reports", icon: "chart" }] },
];

export const findNav = (path: string) => NAV.flatMap((g) => g.items).find((i) => i.href === path);
