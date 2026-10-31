/**
 * Brand palette for StockLink.
 * Indigo → violet primary (trust + premium), emerald for money-in / done,
 * amber for pending, rose for outstanding / damage, deep navy for the shell.
 */
export const Colors = {
  // brand
  primary: "#4F46E5",
  primaryDark: "#4338CA",
  primarySoft: "#EEF0FF",
  primaryRing: "#C7CBFF",
  accent: "#7C3AED",
  accentSoft: "#F3EEFF",
  cyan: "#06B6D4",

  // surfaces
  background: "#F4F6FB",
  surface: "#FFFFFF",
  surfaceMuted: "#F8FAFD",
  surfaceHover: "#F5F6FF",
  readonly: "#F1F3F9",

  // text
  ink: "#0F172A",
  inkSoft: "#334155",
  muted: "#64748B",
  faint: "#94A3B8",

  // lines
  line: "#E6E9F2",
  lineStrong: "#D3D9E6",

  // status
  success: "#047857",
  successBright: "#10B981",
  successSoft: "#E3F7EF",
  warning: "#B45309",
  warningBright: "#F59E0B",
  warningSoft: "#FFF4E0",
  danger: "#BE123C",
  dangerBright: "#F43F5E",
  dangerSoft: "#FFE8EC",
  info: "#0369A1",
  infoSoft: "#E4F4FD",

  // shell
  sidebar: "#0D1124",
  sidebarAlt: "#161B3A",
  sidebarText: "#AEB6D6",
  sidebarMuted: "#5D6895",
  sidebarHover: "rgba(255,255,255,0.06)",

  white: "#FFFFFF",
  overlay: "rgba(13,17,36,0.55)",
} as const;

export const Gradients = {
  primary: `linear-gradient(135deg, ${Colors.primary} 0%, ${Colors.accent} 100%)`,
  success: `linear-gradient(135deg, #10B981 0%, #059669 100%)`,
  warning: `linear-gradient(135deg, #F59E0B 0%, #F97316 100%)`,
  danger: `linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)`,
  info: `linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)`,
  sidebar: `linear-gradient(180deg, ${Colors.sidebar} 0%, ${Colors.sidebarAlt} 100%)`,
  hero: `radial-gradient(1200px 300px at 0% 0%, rgba(124,58,237,0.10), transparent 60%), radial-gradient(900px 260px at 100% 0%, rgba(6,182,212,0.10), transparent 60%)`,
} as const;

export type Tone = "primary" | "success" | "warning" | "danger" | "info";
