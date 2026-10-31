"use client";

import { useLayoutEffect, useRef, useState } from "react";

/** Segmented tabs with a sliding active indicator. */
export default function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState({ left: 0, width: 0, top: 0, height: 0 });

  useLayoutEffect(() => {
    const measure = () => {
      const el = wrap.current?.querySelector<HTMLButtonElement>(".tab.on");
      if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth, top: el.offsetTop, height: el.offsetHeight });
    };
    measure();
    // re-measure when tab widths change (web font swap, wrapping, viewport resize)
    const ro = new ResizeObserver(measure);
    wrap.current?.querySelectorAll(".tab").forEach((t) => ro.observe(t));
    return () => ro.disconnect();
  }, [value, tabs.length]);

  return (
    <div className="tabs" ref={wrap} role="tablist">
      <span className="tab-pill" style={pill} />
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={t.value === value} className={`tab ${t.value === value ? "on" : ""}`} onClick={() => onChange(t.value)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
