import { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";
import { useAuth } from "./context/AuthContext.jsx";
import { useToast } from "./hooks/useToast.js";
import BulkPanel from "./components/BulkPanel.jsx";
import LoginModal from "./components/LoginModal.jsx";
import OrderForm from "./components/OrderForm.jsx";
import OrdersTable from "./components/OrdersTable.jsx";
import Toast from "./components/Toast.jsx";
import "./App.css";

export default function App() {
  const { user, isAuthenticated, authLoading, login, logout } = useAuth();
  const { toast, showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [bulkAddProgress, setBulkAddProgress] = useState(null);
  const [bulkUpdateProgress, setBulkUpdateProgress] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getOrders();
      setOrders(data.orders || []);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function handleLogin(email, password) {
    try {
      await login(email, password);
      setLoginOpen(false);
      showToast("Signed in.");
    } catch (err) {
      showToast(err.message, "error");
      throw err;
    }
  }

  function requireAuth() {
    if (!isAuthenticated) {
      showToast("Sign in to add, edit, or delete orders.", "error");
      setLoginOpen(true);
      return false;
    }
    return true;
  }

  async function handleOrderSubmit(form, isEdit) {
    if (!requireAuth()) return;
    try {
      if (isEdit) {
        await api.updateOrder(form.orderNo, {
          status: form.status,
          description: form.description.trim(),
          ticketNumber: form.ticketNumber.trim(),
        });
        showToast(`Order "${form.orderNo}" updated.`);
      } else {
        await api.createOrder({
          orderNo: form.orderNo,
          status: form.status,
          description: form.description,
          ticketNumber: form.ticketNumber,
        });
        showToast(`Order "${form.orderNo.trim()}" added.`);
      }
      setEditing(null);
      await loadOrders();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleDelete(orderNo) {
    if (!requireAuth()) return;
    if (!confirm(`Delete order "${orderNo}"?`)) return;
    try {
      await api.deleteOrder(orderNo);
      if (editing?.orderNo === orderNo) setEditing(null);
      showToast(`Order "${orderNo}" deleted.`);
      await loadOrders();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleBulkAdd(text, clear) {
    if (!requireAuth() || !text.trim()) return;
    let added = 0;
    const errors = [];
    try {
      const items = JSON.parse(text);
      if (!Array.isArray(items)) throw new Error("Input must be a JSON array.");

      const total = items.length;
      setBulkAddProgress({ current: 0, total, label: "Preparing bulk add…" });

      for (let i = 0; i < items.length; i++) {
        const orderNo = String(items[i].orderNo || "").trim();
        setBulkAddProgress({
          current: i,
          total,
          label: orderNo ? `Adding ${orderNo}…` : `Row ${i + 1}…`,
        });

        try {
          await api.createOrder(items[i]);
          added++;
        } catch (err) {
          errors.push(`Row ${i + 1}: ${err.message}`);
        }

        setBulkAddProgress({
          current: i + 1,
          total,
          label: `Added ${i + 1} of ${total}`,
        });
      }

      setBulkAddProgress({ current: total, total, label: "Refreshing orders…" });
      await loadOrders();
      setBulkAddProgress(null);

      if (errors.length) {
        showToast(`Added ${added}. ${errors.slice(0, 2).join("; ")}`, added ? "success" : "error");
      } else {
        showToast(`${added} order(s) added.`);
        clear("");
      }
    } catch (err) {
      setBulkAddProgress(null);
      showToast(err.message, "error");
    }
  }

  async function handleBulkUpdate(text, clear) {
    if (!requireAuth() || !text.trim()) return;
    let updated = 0;
    const errors = [];
    try {
      const items = JSON.parse(text);
      if (!Array.isArray(items)) throw new Error("Input must be a JSON array.");

      const total = items.length;
      setBulkUpdateProgress({ current: 0, total, label: "Preparing bulk update…" });

      for (let i = 0; i < items.length; i++) {
        const orderNo = String(items[i].orderNo || "").trim();
        setBulkUpdateProgress({
          current: i,
          total,
          label: orderNo ? `Updating ${orderNo}…` : `Row ${i + 1}…`,
        });

        if (!orderNo) {
          errors.push(`Row ${i + 1}: orderNo is required.`);
          setBulkUpdateProgress({ current: i + 1, total, label: `Skipped row ${i + 1}` });
          continue;
        }
        try {
          await api.updateOrder(orderNo, {
            status: items[i].status,
            description: items[i].description,
            ticketNumber: items[i].ticketNumber,
          });
          updated++;
        } catch (err) {
          errors.push(`Row ${i + 1}: ${err.message}`);
        }
        setBulkUpdateProgress({
          current: i + 1,
          total,
          label: `Updated ${i + 1} of ${total}`,
        });
      }

      setBulkUpdateProgress({ current: total, total, label: "Refreshing orders…" });
      await loadOrders();
      setBulkUpdateProgress(null);

      if (errors.length) {
        showToast(`Updated ${updated}. ${errors.slice(0, 2).join("; ")}`, updated ? "success" : "error");
      } else {
        showToast(`${updated} order(s) updated.`);
        clear("");
      }
    } catch (err) {
      setBulkUpdateProgress(null);
      showToast(err.message, "error");
    }
  }

  async function handleBulkDelete(text, clear) {
    if (!requireAuth() || !text.trim()) return;
    const ids = text
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!ids.length) {
      showToast("No valid order numbers.", "error");
      return;
    }
    if (!confirm(`Delete ${ids.length} order(s)?`)) return;

    let deleted = 0;
    const notFound = [];
    for (const id of ids) {
      try {
        await api.deleteOrder(id);
        deleted++;
      } catch (err) {
        if (err.status === 404) notFound.push(id);
        else showToast(err.message, "error");
      }
    }
    await loadOrders();
    setEditing(null);
    let msg = `${deleted} order(s) deleted.`;
    if (notFound.length) msg += ` Not found: ${notFound.join(", ")}.`;
    showToast(msg);
    if (deleted) clear("");
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(orders, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cisco-orders-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Orders exported.");
  }

  async function handleImport(e) {
    if (!requireAuth()) {
      e.target.value = "";
      return;
    }
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const imported = JSON.parse(reader.result);
        if (!Array.isArray(imported)) throw new Error("File must contain a JSON array.");
        if (
          !confirm(
            `Replace all ${orders.length} orders with ${imported.length} imported? This affects everyone.`
          )
        ) {
          return;
        }
        const data = await api.importOrders(imported);
        setOrders(data.orders || []);
        showToast(`Imported ${data.imported} order(s).`);
      } catch (err) {
        showToast(err.message, "error");
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  }

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <div>
            <h1>Cisco Order Tracking</h1>
            <p className="subtitle">
              {isAuthenticated
                ? "You can add, update, and delete orders"
                : "Browse and search orders — sign in to manage"}
            </p>
          </div>
          <div className="header-auth">
            <span className={`auth-status ${isAuthenticated ? "active" : ""}`}>
              {isAuthenticated ? `Signed in as ${user.email}` : "View only"}
            </span>
            {!isAuthenticated ? (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setLoginOpen(true)}>
                Sign in
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  logout();
                  setEditing(null);
                  showToast("Signed out.");
                }}
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container">
        {isAuthenticated && (
          <>
            <OrderForm
              editing={editing}
              onSubmit={handleOrderSubmit}
              onCancel={() => setEditing(null)}
            />
            <BulkPanel
              onBulkAdd={handleBulkAdd}
              onBulkUpdate={handleBulkUpdate}
              onBulkDelete={handleBulkDelete}
              bulkAddProgress={bulkAddProgress}
              bulkUpdateProgress={bulkUpdateProgress}
            />
          </>
        )}

        <OrdersTable
          orders={orders}
          search={search}
          onSearchChange={setSearch}
          loading={loading}
          canEdit={isAuthenticated}
          onEdit={setEditing}
          onDelete={handleDelete}
          onExport={handleExport}
          onImport={handleImport}
        />
      </main>

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLogin={handleLogin}
        loading={authLoading}
      />
      <Toast toast={toast} />
    </>
  );
}
