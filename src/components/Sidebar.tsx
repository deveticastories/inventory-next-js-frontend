"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { initials } from "@/utils/Format";
import { NAV } from "@/utils/Navigation";
import Icon from "./Icon";

export default function Sidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const path = usePathname();
  const user = useSession()?.user;

  return (
    <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
      <div className="brand">
        <span className="brand-mark">
          <Icon name="layers" size={18} stroke={2.4} />
        </span>
        <div>
          <div className="brand-name">
            Stock<span>Link</span>
          </div>
          <div className="brand-sub">Inventory · IND ⇄ UAE</div>
        </div>
      </div>

      <nav className="nav">
        {NAV.map((g) => (
          <div key={g.title} className="nav-group">
            <div className="nav-title">{g.title}</div>
            {g.items.map((i) => {
              const on = i.href === "/" ? path === "/" : path.startsWith(i.href);
              return (
                <Link key={i.href} href={i.href} className={`nav-item ${on ? "on" : ""}`} onClick={onNavigate}>
                  <Icon name={i.icon} size={17} />
                  <span>{i.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="avatar">{user ? initials(user.staffName) : "—"}</div>
        <div>
          <b>{user?.staffName ?? "Signed out"}</b>
          <small>{user?.employeeType ?? ""}</small>
        </div>
      </div>
    </aside>
  );
}
