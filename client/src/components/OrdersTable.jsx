import { useEffect, useMemo, useState } from "react";

const PAGE_SIZES = [10, 25, 50, 100];

function statusClass(status) {
  return "status-" + status.toLowerCase().replace(/\s+/g, "-");
}

export default function OrdersTable({
  orders,
  search,
  onSearchChange,
  loading,
  canEdit,
  onEdit,
  onDelete,
  onExport,
  onImport,
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const q = search.toLowerCase().trim();
  const filtered = useMemo(
    () =>
      q
        ? orders.filter(
            (o) =>
              o.orderNo.toLowerCase().includes(q) ||
              o.status.toLowerCase().includes(q) ||
              (o.description || "").toLowerCase().includes(q) ||
              (o.ticketNumber || "").toLowerCase().includes(q)
          )
        : orders,
    [orders, q]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [search, pageSize, orders.length]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);
  const showingFrom = filtered.length === 0 ? 0 : start + 1;
  const showingTo = Math.min(start + pageSize, filtered.length);

  function goToPage(next) {
    setPage(Math.min(Math.max(1, next), totalPages));
  }

  return (
    <section className="panel">
      <div className="table-header">
        <h2>
          Orders{" "}
          <span className="count">
            ({filtered.length}
            {q && filtered.length !== orders.length ? ` of ${orders.length}` : ""})
          </span>
        </h2>
        <div className="table-actions">
          <input
            type="search"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search orders"
          />
          <button type="button" className="btn btn-secondary" onClick={onExport}>
            Export JSON
          </button>
          {canEdit && (
            <label className="btn btn-secondary file-btn">
              Import JSON
              <input type="file" accept=".json" hidden onChange={onImport} />
            </label>
          )}
        </div>
      </div>

      {loading && <p className="loading-hint">Loading orders…</p>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order No</th>
              <th>Status</th>
              <th>Description</th>
              <th>Ticket Number</th>
              {canEdit && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={canEdit ? 5 : 4}>
                  {loading
                    ? "Loading…"
                    : orders.length === 0
                      ? canEdit
                        ? "No orders yet. Add your first order above."
                        : "No orders yet."
                      : "No orders match your search."}
                </td>
              </tr>
            ) : (
              paginated.map((o) => (
                <tr key={o.id || o.orderNo}>
                  <td>
                    <strong>{o.orderNo}</strong>
                  </td>
                  <td>
                    <span className={`status-badge ${statusClass(o.status)}`}>{o.status}</span>
                  </td>
                  <td>{o.description || "—"}</td>
                  <td>{o.ticketNumber || "—"}</td>
                  {canEdit && (
                    <td className="row-actions">
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => onEdit(o)}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(o.orderNo)}>
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && filtered.length > 0 && (
        <div className="pagination">
          <div className="pagination-info">
            Showing {showingFrom}–{showingTo} of {filtered.length}
          </div>
          <div className="pagination-controls">
            <label className="pagination-size">
              Per page
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                aria-label="Rows per page"
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
            >
              Previous
            </button>
            <span className="pagination-page">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
