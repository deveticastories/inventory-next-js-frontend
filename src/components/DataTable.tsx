import type { ReactNode, Ref } from "react";
import Icon from "./Icon";

export type Row = ReactNode[];

export default function DataTable({
  head,
  rows,
  empty = "No records yet",
  tableRef,
  rowKeys,
}: {
  head: ReactNode[];
  rows: Row[];
  empty?: string;
  tableRef?: Ref<HTMLTableElement>;
  rowKeys?: (string | number)[];
}) {
  return (
    <div className="table-wrap">
      <table ref={tableRef}>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((r, i) => (
              <tr key={rowKeys?.[i] ?? i} style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
                {r.map((c, j) => (
                  <td key={j}>{c}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={head.length} className="empty">
                <div className="empty-inner">
                  <span className="empty-icon">
                    <Icon name="layers" size={22} />
                  </span>
                  {empty}
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Totals({ items }: { items: [string, ReactNode][] }) {
  return (
    <div className="totals">
      {items.map(([l, v]) => (
        <div key={l}>
          <span>{l}</span>
          <b>{v}</b>
        </div>
      ))}
    </div>
  );
}
