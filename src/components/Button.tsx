import type { ButtonHTMLAttributes } from "react";
import Icon, { type IconName } from "./Icon";

type Variant = "primary" | "ghost" | "success" | "danger" | "soft";

export default function Button({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "sm" | "md";
  icon?: IconName;
  iconRight?: IconName;
}) {
  return (
    <button type="button" className={`btn btn-${variant} btn-${size} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={size === "sm" ? 14 : 16} stroke={2.4} />}
      {children && <span>{children}</span>}
      {iconRight && <Icon name={iconRight} size={size === "sm" ? 14 : 16} stroke={2.4} />}
    </button>
  );
}
