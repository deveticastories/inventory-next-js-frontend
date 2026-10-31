const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Opens a print-ready window (Save as PDF from the print dialog).
 * Returns false when the browser blocked the pop-up.
 */
export function printDoc(title: string, head: string[], rows: (string | number)[][], extraHtml = ""): boolean {
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write(`<html><head><title>${esc(title)}</title><style>
    body{font-family:Arial,sans-serif;padding:26px;color:#111}
    h2{margin:0 0 4px;color:#4F46E5}
    table{width:100%;border-collapse:collapse;margin-top:14px;font-size:12px}
    th,td{border:1px solid #c9cede;padding:6px 8px;text-align:left}
    th{background:#EEF0FF}.m{font-size:12px;color:#555}
  </style></head><body>
  <h2>StockLink — ${esc(title)}</h2>
  <div class="m">Generated ${esc(new Date().toLocaleString())}</div>${extraHtml}
  <table><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
  <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>
  <script>onload=()=>print()<\/script></body></html>`);
  w.document.close();
  return true;
}

/** Reads a rendered <table> back into plain text, so any on-screen table can be exported. */
export function tableToText(table: HTMLTableElement | null) {
  if (!table) return { head: [] as string[], rows: [] as string[][] };
  const head = [...table.querySelectorAll("thead th")].map((th) => (th.textContent ?? "").trim());
  const rows = [...table.querySelectorAll("tbody tr")]
    .filter((tr) => !tr.querySelector("td.empty"))
    .map((tr) => [...tr.querySelectorAll("td")].map((td) => (td.textContent ?? "").trim()));
  return { head, rows };
}

export { esc };
