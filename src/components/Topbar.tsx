"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { useSettings } from "@/hooks/useSettings";
import { logout } from "@/services/AuthenticationServices";
import { findNav, NAV } from "@/utils/Navigation";
import Button from "./Button";
import Icon from "./Icon";
import { useUI } from "./UIProvider";

export default function Topbar({ onMenu }: { onMenu: () => void }) {
  const path = usePathname();
  const router = useRouter();
  const session = useSession();
  const settings = useSettings(!!session);
  const { confirm, toast } = useUI();
  const item = findNav(path);
  const group = NAV.find((g) => g.items.includes(item!))?.title;

  return (
    <header className="topbar">
      <button className="icon-btn menu-btn" onClick={onMenu} aria-label="Open menu">
        <Icon name="menu" />
      </button>
      <div className="crumbs">
        <span>{group ?? "StockLink"}</span>
        <Icon name="arrowRight" size={13} />
        <b>{item?.label ?? "Dashboard"}</b>
      </div>
      <span className="grow" />
      {settings && (
        <span className="rate-chip" title="Exchange rate used in Transit">
          <Icon name="globe" size={14} />1 AED = ₹{settings.exchangeRate}
        </span>
      )}
      <span className="route-chip">
        <i />
        IND ⇄ UAE
      </span>
      <Button
        variant="ghost"
        size="sm"
        icon="arrowLeft"
        onClick={() =>
          confirm("Sign out of StockLink?", () => {
            logout();
            router.replace("/login");
            toast("Signed out", "info");
          })
        }
      >
        <span className="hide-sm">Sign out</span>
      </Button>
    </header>
  );
}
