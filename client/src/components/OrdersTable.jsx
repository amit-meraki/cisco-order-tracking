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
  const q = search.toLowerCase().trim();
  const filtered = q
    ? orders.filter(
        (o) =>
          o.orderNo.toLowerCase().includes(q) ||
          o.status.toLowerCase().includes(q) ||
          (o.description || "").toLowerCase().includes(q) ||
          (o.ticketNumber || "").toLowerCase().includes(q)
      )
    : orders;

  return (
    <section className="panel">
      <div className="table-header">
        <h2>
          Orders <span className="count">({orders.length})</span>
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
              filtered.map((o) => (
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
    </section>
  );
}
