"use client";

import { useEffect, useRef, useState } from "react";

/** Counts up from the previous value with an ease-out curve. */
export default function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toLocaleString("en-IN"),
  duration = 900,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
}) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const ms = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : duration;
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const k = ms ? Math.min(1, (t - start) / ms) : 1;
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(a + (value - a) * eased);
      if (k < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      from.current = value;
    };
  }, [value, duration]);

  return <>{format(shown)}</>;
}
