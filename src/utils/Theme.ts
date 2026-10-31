import { Colors, Gradients } from "./Colors";
import { FontSize, Layout, Motion, Radius, Shadow, Spacing } from "./Sizes";

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());

const group = (prefix: string, obj: Record<string, string | number>) =>
  Object.entries(obj)
    .filter(([, v]) => typeof v === "string")
    .map(([k, v]) => `--${prefix}-${kebab(k)}:${v};`)
    .join("");

/**
 * Turns the TS tokens in Colors.ts / Sizes.ts into CSS custom properties so
 * the stylesheet and components share one source of truth.
 */
export const themeCss = `:root{${[
  group("c", Colors),
  group("g", Gradients),
  group("sp", Spacing),
  group("r", Radius),
  group("fs", FontSize),
  group("l", Layout),
  group("sh", Shadow),
  group("m", Motion),
].join("")}}`;
