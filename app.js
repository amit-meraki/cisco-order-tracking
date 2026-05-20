const STORAGE_KEY = "cisco-orders";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

let orders = loadOrders();

function loadOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveOrders() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

function normalizeOrderNo(value) {
  return String(value ?? "").trim();
}

function findOrderIndex(orderNo) {
  const id = normalizeOrderNo(orderNo);
  return orders.findIndex((o) => normalizeOrderNo(o.orderNo) === id);
}

function statusClass(status) {
  return "status-" + status.toLowerCase().replace(/\s+/g, "-");
}

function showToast(message, type = "success") {
  const toast = $("#toast");
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function renderTable(filter = "") {
  const tbody = $("#orders-body");
  const q = filter.toLowerCase().trim();
  const filtered = q
    ? orders.filter(
        (o) =>
          o.orderNo.toLowerCase().includes(q) ||
          o.status.toLowerCase().includes(q) ||
          (o.description || "").toLowerCase().includes(q) ||
          (o.ticketNumber || "").toLowerCase().includes(q)
      )
    : orders;

  $("#order-count").textContent = `(${orders.length})`;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="5">${
      orders.length === 0 ? "No orders yet. Add your first order above." : "No orders match your search."
    }</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .map(
      (o) => `
    <tr data-order-no="${escapeAttr(o.orderNo)}">
      <td><strong>${escapeHtml(o.orderNo)}</strong></td>
      <td><span class="status-badge ${statusClass(o.status)}">${escapeHtml(o.status)}</span></td>
      <td>${escapeHtml(o.description || "—")}</td>
      <td>${escapeHtml(o.ticketNumber || "—")}</td>
      <td class="row-actions">
        <button type="button" class="btn btn-secondary btn-sm edit-btn" data-order-no="${escapeAttr(o.orderNo)}">Edit</button>
        <button type="button" class="btn btn-danger btn-sm delete-btn" data-order-no="${escapeAttr(o.orderNo)}">Delete</button>
      </td>
    </tr>`
    )
    .join("");

  tbody.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => startEdit(btn.dataset.orderNo));
  });
  tbody.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => deleteOrder(btn.dataset.orderNo));
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return String(str).replace(/"/g, "&quot;");
}

function resetForm() {
  $("#order-form").reset();
  $("#edit-mode").value = "add";
  $("#form-title").textContent = "Add Order";
  $("#submit-btn").textContent = "Add Order";
  $("#order-no").disabled = false;
  $("#cancel-edit-btn").hidden = true;
}

function startEdit(orderNo) {
  const idx = findOrderIndex(orderNo);
  if (idx === -1) {
    showToast(`Order "${orderNo}" not found.`, "error");
    return;
  }
  const o = orders[idx];
  $("#edit-mode").value = "edit";
  $("#form-title").textContent = "Update Order";
  $("#submit-btn").textContent = "Update Order";
  $("#order-no").value = o.orderNo;
  $("#order-no").disabled = true;
  $("#status").value = o.status;
  $("#description").value = o.description || "";
  $("#ticket-number").value = o.ticketNumber || "";
  $("#cancel-edit-btn").hidden = false;
  $("#single-order-panel").scrollIntoView({ behavior: "smooth" });
}

function addOrder(data) {
  const orderNo = normalizeOrderNo(data.orderNo);
  if (!orderNo) throw new Error("Order number is required.");
  if (!data.status) throw new Error("Status is required.");
  if (findOrderIndex(orderNo) !== -1) {
    throw new Error(`Order "${orderNo}" already exists.`);
  }
  orders.push({
    orderNo,
    status: data.status,
    description: (data.description || "").trim(),
    ticketNumber: (data.ticketNumber || "").trim(),
  });
}

function updateOrder(orderNo, data) {
  const idx = findOrderIndex(orderNo);
  if (idx === -1) throw new Error(`Order "${orderNo}" not found.`);
  if (data.status !== undefined) orders[idx].status = data.status;
  if (data.description !== undefined) orders[idx].description = data.description;
  if (data.ticketNumber !== undefined) orders[idx].ticketNumber = data.ticketNumber;
}

function deleteOrder(orderNo) {
  const id = normalizeOrderNo(orderNo);
  if (!confirm(`Delete order "${id}"?`)) return;
  const idx = findOrderIndex(id);
  if (idx === -1) {
    showToast(`Order "${id}" not found.`, "error");
    return;
  }
  orders.splice(idx, 1);
  saveOrders();
  renderTable($("#search").value);
  if ($("#edit-mode").value === "edit" && normalizeOrderNo($("#order-no").value) === id) {
    resetForm();
  }
  showToast(`Order "${id}" deleted.`);
}

function parseBulkJson(text) {
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error("Input must be a JSON array.");
  return parsed;
}

function parseBulkDeleteIds(text) {
  return text
    .split(/[\n,]+/)
    .map((s) => normalizeOrderNo(s))
    .filter(Boolean);
}

// Event: single order form
$("#order-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const data = {
    orderNo: $("#order-no").value,
    status: $("#status").value,
    description: $("#description").value,
    ticketNumber: $("#ticket-number").value,
  };

  try {
    if ($("#edit-mode").value === "edit") {
      updateOrder(data.orderNo, {
        status: data.status,
        description: data.description.trim(),
        ticketNumber: data.ticketNumber.trim(),
      });
      showToast(`Order "${data.orderNo}" updated.`);
    } else {
      addOrder({
        orderNo: data.orderNo,
        status: data.status,
        description: data.description,
        ticketNumber: data.ticketNumber,
      });
      showToast(`Order "${normalizeOrderNo(data.orderNo)}" added.`);
    }
    saveOrders();
    renderTable($("#search").value);
    resetForm();
  } catch (err) {
    showToast(err.message, "error");
  }
});

$("#cancel-edit-btn").addEventListener("click", resetForm);

// Event: bulk tabs
$$(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    $$(".tab").forEach((t) => t.classList.remove("active"));
    $$(".tab-panel").forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    $(`#${tab.dataset.tab}`).classList.add("active");
  });
});

$("#bulk-add-btn").addEventListener("click", () => {
  const text = $("#bulk-add-input").value.trim();
  if (!text) {
    showToast("Paste JSON to bulk add.", "error");
    return;
  }
  let added = 0;
  const errors = [];
  try {
    const items = parseBulkJson(text);
    items.forEach((item, i) => {
      try {
        addOrder(item);
        added++;
      } catch (err) {
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    });
    if (added > 0) {
      saveOrders();
      renderTable($("#search").value);
    }
    if (errors.length) {
      showToast(`Added ${added}. Errors: ${errors.slice(0, 3).join("; ")}${errors.length > 3 ? "…" : ""}`, added ? "success" : "error");
    } else {
      showToast(`${added} order(s) added.`);
      $("#bulk-add-input").value = "";
    }
  } catch (err) {
    showToast(err.message, "error");
  }
});

$("#bulk-update-btn").addEventListener("click", () => {
  const text = $("#bulk-update-input").value.trim();
  if (!text) {
    showToast("Paste JSON to bulk update.", "error");
    return;
  }
  let updated = 0;
  const errors = [];
  try {
    const items = parseBulkJson(text);
    items.forEach((item, i) => {
      const orderNo = normalizeOrderNo(item.orderNo);
      if (!orderNo) {
        errors.push(`Row ${i + 1}: orderNo is required.`);
        return;
      }
      try {
        updateOrder(orderNo, {
          status: item.status,
          description: item.description !== undefined ? String(item.description).trim() : undefined,
          ticketNumber: item.ticketNumber !== undefined ? String(item.ticketNumber).trim() : undefined,
        });
        updated++;
      } catch (err) {
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    });
    if (updated > 0) {
      saveOrders();
      renderTable($("#search").value);
    }
    if (errors.length) {
      showToast(`Updated ${updated}. Errors: ${errors.slice(0, 3).join("; ")}${errors.length > 3 ? "…" : ""}`, updated ? "success" : "error");
    } else {
      showToast(`${updated} order(s) updated.`);
      $("#bulk-update-input").value = "";
    }
  } catch (err) {
    showToast(err.message, "error");
  }
});

$("#bulk-delete-btn").addEventListener("click", () => {
  const text = $("#bulk-delete-input").value.trim();
  if (!text) {
    showToast("Enter order numbers to delete.", "error");
    return;
  }
  const ids = parseBulkDeleteIds(text);
  if (!ids.length) {
    showToast("No valid order numbers found.", "error");
    return;
  }
  if (!confirm(`Delete ${ids.length} order(s)?`)) return;

  let deleted = 0;
  const notFound = [];
  ids.forEach((id) => {
    const idx = findOrderIndex(id);
    if (idx === -1) notFound.push(id);
    else {
      orders.splice(idx, 1);
      deleted++;
    }
  });
  saveOrders();
  renderTable($("#search").value);
  resetForm();
  let msg = `${deleted} order(s) deleted.`;
  if (notFound.length) msg += ` Not found: ${notFound.join(", ")}.`;
  showToast(msg, notFound.length && !deleted ? "error" : "success");
  if (deleted) $("#bulk-delete-input").value = "";
});

$("#search").addEventListener("input", (e) => renderTable(e.target.value));

$("#export-btn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(orders, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cisco-orders-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("Orders exported.");
});

$("#import-file").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!Array.isArray(imported)) throw new Error("File must contain a JSON array.");
      if (!confirm(`Replace all ${orders.length} orders with ${imported.length} imported orders?`)) return;
      orders = imported.map((o) => ({
        orderNo: normalizeOrderNo(o.orderNo),
        status: o.status || "Pending",
        description: (o.description || "").trim(),
        ticketNumber: (o.ticketNumber || "").trim(),
      })).filter((o) => o.orderNo);
      saveOrders();
      renderTable($("#search").value);
      showToast(`Imported ${orders.length} order(s).`);
    } catch (err) {
      showToast(err.message, "error");
    }
    e.target.value = "";
  };
  reader.readAsText(file);
});

renderTable();
