/** Spacing, radius, type scale, layout and motion tokens. */
export const Spacing = {
  xxs: "4px",
  xs: "6px",
  sm: "10px",
  md: "14px",
  lg: "20px",
  xl: "28px",
  xxl: "40px",
} as const;

export const Radius = {
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "22px",
  pill: "999px",
} as const;

export const FontSize = {
  xs: "11px",
  sm: "12.5px",
  base: "14px",
  md: "15px",
  lg: "18px",
  xl: "24px",
  xxl: "28px",
} as const;

export const Layout = {
  sidebarWidth: "264px",
  topbarHeight: "64px",
  contentMax: "1320px",
  mobileBreakpoint: 900,
} as const;

export const Shadow = {
  sm: "0 1px 2px rgba(15,23,42,0.05)",
  md: "0 6px 20px -6px rgba(15,23,42,0.10)",
  lg: "0 24px 60px -12px rgba(15,23,42,0.28)",
  glow: "0 10px 24px -8px rgba(79,70,229,0.55)",
} as const;

export const Motion = {
  fast: "150ms",
  base: "240ms",
  slow: "420ms",
  ease: "cubic-bezier(.2,.8,.2,1)",
  spring: "cubic-bezier(.34,1.56,.64,1)",
  stagger: 55,
} as const;
