import { useEffect, useState } from "react";

const STATUSES = ["Pending", "In Progress", "Shipped", "Resolved", "Cancelled", "On Hold"];

const empty = { orderNo: "", status: "", description: "", ticketNumber: "" };

export default function OrderForm({ editing, onSubmit, onCancel }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (editing) {
      setForm({
        orderNo: editing.orderNo,
        status: editing.status,
        description: editing.description || "",
        ticketNumber: editing.ticketNumber || "",
      });
    } else {
      setForm(empty);
    }
  }, [editing]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await onSubmit(form, Boolean(editing));
    if (!editing) setForm(empty);
  }

  return (
    <section className="panel">
      <h2>{editing ? "Update Order" : "Add Order"}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="field">
            Order No <span className="required">*</span>
            <input
              value={form.orderNo}
              onChange={(e) => update("orderNo", e.target.value)}
              required
              disabled={Boolean(editing)}
              placeholder="e.g. PO-12345"
            />
          </label>
          <label className="field">
            Status <span className="required">*</span>
            <select value={form.status} onChange={(e) => update("status", e.target.value)} required>
              <option value="">Select status</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="field full-width">
            Description
            <input
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Order description"
            />
          </label>
          <label className="field">
            Ticket Number
            <input
              value={form.ticketNumber}
              onChange={(e) => update("ticketNumber", e.target.value)}
              placeholder="e.g. INC0012345"
            />
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {editing ? "Update Order" : "Add Order"}
          </button>
          {editing && (
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
