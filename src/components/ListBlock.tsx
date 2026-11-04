"use client";

import { useRef, useState, type ReactNode } from "react";
import { printDoc, tableToText } from "@/utils/Print";
import Button from "./Button";
import DataTable, { type Row } from "./DataTable";
import Icon from "./Icon";
import { useUI } from "./UIProvider";

/** Search + sort/filter state for a ListBlock. */
export function useListFilter<S extends string>(defaultSort: S) {
  const [q, setQ] = useState("");
  const [s, setS] = useState<S>(defaultSort);
  return { q, setQ, s, setS };
}

/** Toolbar (search, sort, Download PDF) on top of a data table. */
export default function ListBlock<S extends string>({
  title,
  head,
  rows,
  empty,
  filter,
  searchPlaceholder,
  sorts,
  rowKeys,
}: {
  title: string;
  head: ReactNode[];
  rows: Row[];
  empty?: string;
  filter: ReturnType<typeof useListFilter<S>>;
  searchPlaceholder?: string;
  sorts?: [S, string][];
  rowKeys?: (string | number)[];
}) {
  const ref = useRef<HTMLTableElement>(null);
  const { toast } = useUI();

  const pdf = () => {
    const { head: h, rows: r } = tableToText(ref.current);
    if (!printDoc(title, h, r)) toast("Couldn't open the print dialog", "error");
  };

  return (
    <>
      <div className="toolbar">
        {searchPlaceholder && (
          <div className="search">
            <Icon name="search" size={16} />
            <input className="input" placeholder={searchPlaceholder} value={filter.q} onChange={(e) => filter.setQ(e.target.value)} />
          </div>
        )}
        {sorts && sorts.length > 0 && (
          <div className="select-wrap">
            <select className="input" value={filter.s} onChange={(e) => filter.setS(e.target.value as S)}>
              {sorts.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <Icon name="chevronDown" size={16} className="select-caret" />
          </div>
        )}
        <span className="grow" />
        <span className="count-chip">{rows.length} records</span>
        <Button variant="ghost" icon="download" onClick={pdf}>
          Download PDF
        </Button>
      </div>
      <DataTable head={head} rows={rows} empty={empty} tableRef={ref} rowKeys={rowKeys} />
    </>
  );
}
