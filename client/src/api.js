const TOKEN_KEY = "cisco-auth-token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || res.statusText || "Request failed");
    err.status = res.status;
    throw err;
  }

  return data;
}

export const api = {
  login(email, password) {
    return request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  getOrders() {
    return request("/api/orders");
  },

  createOrder(order) {
    return request("/api/orders", {
      method: "POST",
      body: JSON.stringify(order),
    });
  },

  updateOrder(orderNo, patch) {
    return request(`/api/orders/${encodeURIComponent(orderNo)}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    });
  },

  deleteOrder(orderNo) {
    return request(`/api/orders/${encodeURIComponent(orderNo)}`, {
      method: "DELETE",
    });
  },

  importOrders(orders) {
    return request("/api/orders", {
      method: "PUT",
      body: JSON.stringify({ replaceAll: true, orders }),
    });
  },
};
