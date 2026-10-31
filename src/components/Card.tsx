import type { ReactNode } from "react";
import Icon, { type IconName } from "./Icon";

export default function Card({
  title,
  icon,
  action,
  children,
  className = "",
  flush,
}: {
  title?: ReactNode;
  icon?: IconName;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** No inner padding — for edge-to-edge tables. */
  flush?: boolean;
}) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <div className="card-head">
          {title && (
            <h3>
              {icon && (
                <span className="card-icon">
                  <Icon name={icon} size={16} />
                </span>
              )}
              {title}
            </h3>
          )}
          {action && <div className="card-action">{action}</div>}
        </div>
      )}
      <div className={flush ? "" : "card-body"}>{children}</div>
    </section>
  );
}
