import type { ReactNode } from "react";
import type { Tone } from "@/utils/Colors";
import AnimatedNumber from "./AnimatedNumber";
import Icon, { type IconName } from "./Icon";

export function StatGrid({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return <div className={`stats stagger ${wide ? "wide" : ""}`}>{children}</div>;
}

export default function StatCard({
  label,
  value,
  format,
  icon = "trend",
  tone = "primary",
  hint,
}: {
  label: string;
  value: number | string;
  format?: (n: number) => string;
  icon?: IconName;
  tone?: Tone;
  hint?: string;
}) {
  return (
    <div className={`stat stat-${tone}`}>
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <span className="stat-icon">
          <Icon name={icon} size={18} />
        </span>
      </div>
      <div className="stat-value">{typeof value === "number" ? <AnimatedNumber value={value} format={format} /> : value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
      <span className="stat-glow" />
    </div>
  );
}
