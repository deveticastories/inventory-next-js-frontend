"use client";

import { useEffect, useRef, useState } from "react";
import type { Option } from "@/types";
import Icon from "./Icon";

/** Searchable dropdown: type to filter, click to pick. */
export default function Combo({
  options,
  value,
  onChange,
  placeholder = "Select…",
}: {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const selected = options.find((o) => o.value === value);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", off);
    return () => document.removeEventListener("mousedown", off);
  }, [open]);

  const list = options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className={`combo ${open ? "combo-open" : ""}`} ref={ref}>
      <Icon name="search" size={15} className="combo-search" />
      <input
        className="input"
        autoComplete="off"
        placeholder={placeholder}
        value={open ? query : (selected?.label ?? "")}
        onFocus={() => {
          setQuery("");
          setOpen(true);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          if (e.key === "Enter" && list[0]) {
            onChange(list[0].value);
            setOpen(false);
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
      <Icon name="chevronDown" size={16} className="combo-caret" />
      {open && (
        <div className="combo-list">
          {list.length ? (
            list.map((o) => (
              <div
                key={o.value}
                className={`combo-opt ${o.value === value ? "on" : ""}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(o.value);
                  setOpen(false);
                  (document.activeElement as HTMLElement | null)?.blur();
                }}
              >
                {o.label}
                {o.value === value && <Icon name="check" size={14} stroke={2.6} />}
              </div>
            ))
          ) : (
            <div className="combo-empty">No match</div>
          )}
        </div>
      )}
    </div>
  );
}
