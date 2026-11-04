const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Prints from a hidden iframe on the current page (Save as PDF from the print dialog).
 * A pop-up would share this tab's thread, so its open print dialog froze the app
 * whenever the user switched back to it. Returns false if the frame couldn't be created.
 */
export function printDoc(title: string, head: string[], rows: (string | number)[][], extraHtml = ""): boolean {
  document.querySelector("iframe[data-print]")?.remove();
  const frame = document.createElement("iframe");
  frame.dataset.print = "";
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;width:0;height:0;border:0;right:0;bottom:0;visibility:hidden";
  document.body.appendChild(frame);
  const w = frame.contentWindow;
  if (!w) {
    frame.remove();
    return false;
  }
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
</body></html>`);
  w.document.close();
  // Chrome names the saved PDF after the top page, so borrow the invoice title while printing.
  const pageTitle = document.title;
  const done = () => {
    document.title = pageTitle;
    frame.remove();
  };
  w.addEventListener("afterprint", () => setTimeout(done, 0));
  document.title = title;
  // Defer so React can commit the current update (e.g. closing the form) before the dialog opens.
  setTimeout(() => {
    w.focus();
    w.print();
  }, 50);
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
