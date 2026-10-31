import type { ReactNode } from "react";

export type BadgeTone = "ok" | "warn" | "bad" | "info" | "neutral";

export default function Badge({ tone = "neutral", children, dot = true }: { tone?: BadgeTone; children: ReactNode; dot?: boolean }) {
  return (
    <span className={`badge badge-${tone}`}>
      {dot && <i />}
      {children}
    </span>
  );
}
