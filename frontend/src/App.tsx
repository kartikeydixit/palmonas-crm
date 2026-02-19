import React from "react";
import { OrdersDashboard } from "./OrdersDashboard.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

type AuthState =
  | { status: "anonymous" }
  | { status: "authenticated"; accessToken: string; email: string; role: string };

export function App() {
  const [auth, setAuth] = React.useState<AuthState>({ status: "anonymous" });
  const [email, setEmail] = React.useState("admin@palmonas.local");
  const [password, setPassword] = React.useState("Admin@12345");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Login failed");
      setAuth({
        status: "authenticated",
        accessToken: data.accessToken,
        email: data.user.email,
        role: data.user.role
      });
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  if (auth.status === "authenticated") {
    return <OrdersDashboard auth={auth} onLogout={() => setAuth({ status: "anonymous" })} />;
  }

  return (
    <div className="container">
      <h2 style={{ margin: "0 0 6px" }}>Palmonas Admin CRM</h2>
      <div className="muted" style={{ marginBottom: 18 }}>
        MVP portal — Login to manage orders
      </div>

      <div className="row">
        <div className="card" style={{ maxWidth: 400 }}>
          <h3 style={{ marginTop: 0 }}>Admin Login</h3>
          <form onSubmit={login}>
            <label className="muted">Email</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            <div style={{ height: 10 }} />
            <label className="muted">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div style={{ height: 12 }} />
            <button className="btn primary" disabled={loading} type="submit">
              {loading ? "Signing in..." : "Sign in"}
            </button>
            {error ? <div style={{ marginTop: 10, color: "#ffb4b4" }}>{error}</div> : null}
          </form>
        </div>
      </div>
    </div>
  );
}
