import Link from "next/link";
import Icon, { type IconName } from "./Icon";

export interface FlowStep {
  label: string;
  href: string;
  icon: IconName;
}

/** Visual of the end-to-end business flow; each step links to its screen. */
export default function FlowSteps({ steps }: { steps: FlowStep[] }) {
  return (
    <div className="flow">
      {steps.map((s, i) => (
        <div key={s.label} className="flow-step" style={{ animationDelay: `${i * 70}ms` }}>
          <Link href={s.href} className="flow-node">
            <span className="flow-icon">
              <Icon name={s.icon} size={18} />
            </span>
            <span className="flow-n">{String(i + 1).padStart(2, "0")}</span>
            <span className="flow-label">{s.label}</span>
          </Link>
          {i < steps.length - 1 && <span className="flow-line" />}
        </div>
      ))}
    </div>
  );
}
