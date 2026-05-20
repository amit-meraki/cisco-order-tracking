import { useState } from "react";

const TABS = [
  { id: "add", label: "Bulk Add" },
  { id: "update", label: "Bulk Update" },
  { id: "delete", label: "Bulk Delete" },
];

export default function BulkPanel({ orders, onBulkAdd, onBulkUpdate, onBulkDelete }) {
  const [tab, setTab] = useState("add");
  const [addText, setAddText] = useState("");
  const [updateText, setUpdateText] = useState("");
  const [deleteText, setDeleteText] = useState("");

  return (
    <section className="panel">
      <h2>Bulk Operations</h2>
      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "add" && (
        <>
          <p className="hint">
            Paste a JSON array. Each object needs orderNo and status; description and ticketNumber are optional.
          </p>
          <textarea
            className="mono"
            rows={6}
            value={addText}
            onChange={(e) => setAddText(e.target.value)}
            placeholder={'[{"orderNo":"PO-001","status":"Pending"}]'}
          />
          <div className="form-actions">
            <button type="button" className="btn btn-primary" onClick={() => onBulkAdd(addText, setAddText)}>
              Add All
            </button>
          </div>
        </>
      )}

      {tab === "update" && (
        <>
          <p className="hint">Paste a JSON array. Each object must include orderNo and fields to update.</p>
          <textarea
            className="mono"
            rows={6}
            value={updateText}
            onChange={(e) => setUpdateText(e.target.value)}
          />
          <div className="form-actions">
            <button type="button" className="btn btn-primary" onClick={() => onBulkUpdate(updateText, setUpdateText)}>
              Update All
            </button>
          </div>
        </>
      )}

      {tab === "delete" && (
        <>
          <p className="hint">Order numbers — one per line or comma-separated.</p>
          <textarea className="mono" rows={4} value={deleteText} onChange={(e) => setDeleteText(e.target.value)} />
          <div className="form-actions">
            <button type="button" className="btn btn-danger" onClick={() => onBulkDelete(deleteText, setDeleteText)}>
              Delete All
            </button>
          </div>
        </>
      )}
    </section>
  );
}
