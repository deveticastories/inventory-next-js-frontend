import type { ReactNode } from "react";
import Icon from "./Icon";

export default function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "ok"; children: ReactNode }) {
  return (
    <div className={`notice notice-${tone}`}>
      <Icon name={tone === "warn" ? "alert" : tone === "ok" ? "check" : "info"} size={17} />
      <div>{children}</div>
    </div>
  );
}
