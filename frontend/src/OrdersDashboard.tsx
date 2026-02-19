import React from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";
const WORKER_URL = "http://localhost:4020";

type Order = {
  _id: string;
  externalId: string;
  channel: "website" | "amazon" | "blinkit";
  customer: { name: string; phone: string };
  items: Array<{ sku: string; name: string; qty: number; price: number }>;
  total: number;
  currency: string;
  status: "PLACED" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  createdAt: string;
};

type AuthState = { status: "authenticated"; accessToken: string; email: string; role: string };

export function OrdersDashboard({ auth, onLogout }: { auth: AuthState; onLogout: () => void }) {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [channelFilter, setChannelFilter] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<string>("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [syncing, setSyncing] = React.useState(false);

  const fetchOrders = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20"
      });
      if (channelFilter) params.append("channel", channelFilter);
      if (statusFilter) params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`${API_BASE_URL}/orders?${params}`, {
        headers: { authorization: `Bearer ${auth.accessToken}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to fetch orders");
      setOrders(data.orders || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [page, channelFilter, statusFilter, searchQuery, auth.accessToken]);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function triggerSync(channel: string) {
    setSyncing(true);
    try {
      const res = await fetch(`${WORKER_URL}/sync`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ channel, count: 10 })
      });
      if (!res.ok) throw new Error("Sync failed");
      setTimeout(() => fetchOrders(), 2000);
    } catch (err: any) {
      alert(err?.message ?? "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  async function updateStatus(orderId: string, newStatus: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${auth.accessToken}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error("Update failed");
      fetchOrders();
    } catch (err: any) {
      alert(err?.message ?? "Update failed");
    }
  }

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: 0 }}>Orders Dashboard</h2>
          <div className="muted">Signed in as {auth.email} ({auth.role})</div>
        </div>
        <button className="btn" onClick={onLogout}>
          Logout
        </button>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <h3 style={{ marginTop: 0 }}>Sync Orders</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["website", "amazon", "blinkit"] as const).map((ch) => (
            <button
              key={ch}
              className="btn"
              disabled={syncing}
              onClick={() => triggerSync(ch)}
              style={{ textTransform: "capitalize" }}
            >
              Sync {ch}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <h3 style={{ marginTop: 0 }}>Filters</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <div>
            <label className="muted">Channel</label>
            <select
              className="input"
              value={channelFilter}
              onChange={(e) => {
                setChannelFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All</option>
              <option value="website">Website</option>
              <option value="amazon">Amazon</option>
              <option value="blinkit">Blinkit</option>
            </select>
          </div>
          <div>
            <label className="muted">Status</label>
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All</option>
              <option value="PLACED">Placed</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="muted">Search</label>
            <input
              className="input"
              placeholder="Order ID, customer..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card">Loading orders...</div>
      ) : error ? (
        <div className="card" style={{ color: "#ffb4b4" }}>
          Error: {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="card">No orders found. Try syncing orders from channels.</div>
      ) : (
        <>
          <div className="card" style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Channel</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  {auth.role === "admin" && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <code style={{ fontSize: 12 }}>{order.externalId}</code>
                    </td>
                    <td>
                      <span className="pill" style={{ textTransform: "capitalize" }}>
                        {order.channel}
                      </span>
                    </td>
                    <td>
                      <div>{order.customer.name}</div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {order.customer.phone}
                      </div>
                    </td>
                    <td>
                      {order.items.map((item, i) => (
                        <div key={i} style={{ fontSize: 12 }}>
                          {item.qty}x {item.name}
                        </div>
                      ))}
                    </td>
                    <td>
                      {order.currency} {order.total.toLocaleString()}
                    </td>
                    <td>
                      <span className="pill">{order.status}</span>
                    </td>
                    <td style={{ fontSize: 12 }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                    {auth.role === "admin" && (
                      <td>
                        <select
                          className="input"
                          style={{ fontSize: 12, padding: 4 }}
                          value={order.status}
                          onChange={(e) => updateStatus(order._id, e.target.value)}
                        >
                          <option value="PLACED">Placed</option>
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="SHIPPED">Shipped</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="card" style={{ display: "flex", justifyContent: "center", gap: 8 }}>
              <button className="btn" disabled={page === 1} onClick={() => setPage(page - 1)}>
                Previous
              </button>
              <span style={{ alignSelf: "center" }}>
                Page {page} of {totalPages}
              </span>
              <button className="btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
