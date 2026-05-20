import { useState } from "react";

export default function LoginModal({ open, onClose, onLogin, loading }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    await onLogin(email.trim(), password);
    setPassword("");
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          &times;
        </button>
        <h2>Sign in</h2>
        <p className="modal-hint">
          Sign in to add, edit, or delete orders. Accounts are created by an administrator — there is no sign-up.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="field full-width">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@company.com"
              />
            </label>
            <label className="field full-width">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="current-password"
              />
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
