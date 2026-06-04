import React, { useState } from "react";
import { useAuthStore } from "../store/authStore";

export default function AuthPage({ onSuccess }: { onSuccess: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, signup, fetchProfile } = useAuthStore();

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup(username, email, password);
      }
      await fetchProfile();
      onSuccess();
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div style={{
      height: "100vh",
      overflowY: "auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      background: "var(--bg)"
    }}>
      <div style={{ width: "100%", maxWidth: "380px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            fontFamily: "Cinzel",
            fontSize: "20px",
            color: "var(--gold)",
            letterSpacing: "2px",
            marginBottom: "8px"
          }}>✦ ARADHANA</div>
          <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
            {mode === "login" ? "Welcome back" : "Begin your cosmic journey"}
          </p>
        </div>

        {/* Card */}
        <div className="card">

          {/* Tab switcher */}
          <div style={{
            display: "flex",
            background: "var(--bg-surface)",
            borderRadius: "8px",
            padding: "3px",
            marginBottom: "24px"
          }}>
            {(["login", "signup"] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                style={{
                  flex: 1,
                  padding: "8px",
                  border: "none",
                  borderRadius: "6px",
                  background: mode === m ? "var(--bg-card)" : "transparent",
                  color: mode === m ? "var(--text)" : "var(--text-muted)",
                  fontSize: "13px",
                  fontWeight: mode === m ? "500" : "400",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  fontFamily: "Inter"
                }}>
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Fields */}
          {mode === "signup" && (
            <div className="field">
              <label className="label">Username</label>
              <input className="input" type="text"
                placeholder="your_name"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={handleKeyDown} />
            </div>
          )}

          <div className="field">
            <label className="label">Email</label>
            <input className="input" type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={handleKeyDown} />
          </div>

          <div className="field" style={{ marginBottom: "20px" }}>
            <label className="label">Password</label>
            <input className="input" type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKeyDown} />
          </div>

          <button className="btn-primary"
            onClick={handleSubmit}
            disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>

          {error && <p className="error-text">{error}</p>}

        </div>

        <p style={{
          textAlign: "center",
          color: "var(--text-dim)",
          fontSize: "11px",
          marginTop: "20px"
        }}>
          ✦ Your birth data is private and secure
        </p>

      </div>
    </div>
  );
}
