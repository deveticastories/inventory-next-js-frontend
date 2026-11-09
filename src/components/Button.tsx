import type { ButtonHTMLAttributes } from "react";
import Icon, { type IconName } from "./Icon";

type Variant = "primary" | "ghost" | "success" | "danger" | "soft";

export default function Button({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  loading = false,
  className = "",
  children,
  onClick,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "sm" | "md";
  icon?: IconName;
  iconRight?: IconName;
  /** Shows a spinner in place of the icon and ignores clicks while an API call runs. */
  loading?: boolean;
}) {
  const px = size === "sm" ? 14 : 16;
  return (
    <button
      type="button"
      className={`btn btn-${variant} btn-${size} ${loading ? "is-loading" : ""} ${className}`}
      aria-busy={loading || undefined}
      onClick={loading ? undefined : onClick}
      {...rest}
    >
      {loading ? (
        <span className="spinner" style={{ width: px, height: px }} aria-hidden />
      ) : (
        icon && <Icon name={icon} size={px} stroke={2.4} />
      )}
      {children && <span>{children}</span>}
      {iconRight && !loading && <Icon name={iconRight} size={px} stroke={2.4} />}
    </button>
  );
}
