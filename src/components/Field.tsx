"use client";

import { useState, type CSSProperties, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import Icon from "./Icon";

export function Field({
  label,
  children,
  style,
  hint,
}: {
  label: string;
  children: ReactNode;
  style?: CSSProperties;
  hint?: string;
}) {
  return (
    <div className="field" style={style}>
      <label>{label}</label>
      {children}
      {hint && <small className="field-hint">{hint}</small>}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`input ${props.className ?? ""}`} />;
}

export function Select({ options, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { options: (string | { value: string; label: string })[] }) {
  return (
    <div className="select-wrap">
      <select {...props} className={`input ${props.className ?? ""}`}>
        {options.map((o) =>
          typeof o === "string" ? (
            <option key={o} value={o}>
              {o}
            </option>
          ) : (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ),
        )}
      </select>
      <Icon name="chevronDown" size={16} className="select-caret" />
    </div>
  );
}

/** Read-only value shown in a form grid (auto-filled data). */
export function Value({ children, strong, tone }: { children: ReactNode; strong?: boolean; tone?: "danger" | "success" }) {
  return <div className={`value ${strong ? "value-strong" : ""} ${tone ? "value-" + tone : ""}`}>{children}</div>;
}

export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="pw">
      <Input {...props} type={show ? "text" : "password"} />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}>
        <Icon name={show ? "eyeOff" : "eye"} size={16} />
      </button>
    </div>
  );
}
