import React, { useState } from "react";
import { useAuthStore } from "../store/authStore";

export const AuthPage: React.FC = () => {
  const { login, signup, fetchProfile } = useAuthStore();
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLoginTab) {
        await login(email, password);
      } else {
        await signup(username, email, password);
        await fetchProfile();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Authentication failed. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4 relative overflow-hidden"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      {/* Background mandala */}
      <div className="mandala-bg" />

      {/* Auth Card */}
      <div className="card w-full max-w-[420px] relative z-10 shadow-2xl">
        {/* Top: Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div className="logo">✦ ARADHANA</div>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "8px", fontFamily: "Cinzel, serif" }}>
            Your Cosmic Guide
          </p>
          <div className="divider" style={{ marginTop: "24px" }} />
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b mb-6" style={{ borderColor: "var(--border)" }}>
          <button
            type="button"
            className="flex-1 py-3 text-center transition-all font-semibold"
            style={{
              color: isLoginTab ? "var(--gold-primary)" : "var(--text-secondary)",
              borderBottom: isLoginTab ? "2px solid var(--gold-primary)" : "none",
              fontFamily: "Cinzel, serif",
              letterSpacing: "1px"
            }}
            onClick={() => {
              setIsLoginTab(true);
              setError(null);
            }}
          >
            Login
          </button>
          <button
            type="button"
            className="flex-1 py-3 text-center transition-all font-semibold"
            style={{
              color: !isLoginTab ? "var(--gold-primary)" : "var(--text-secondary)",
              borderBottom: !isLoginTab ? "2px solid var(--gold-primary)" : "none",
              fontFamily: "Cinzel, serif",
              letterSpacing: "1px"
            }}
            onClick={() => {
              setIsLoginTab(false);
              setError(null);
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{ color: "var(--saffron)", borderColor: "var(--saffron-dim)" }}
            className="p-3 mb-6 rounded text-sm border bg-red-950/20 text-center"
          >
            {error}
          </div>
        )}

        {/* Form fields */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLoginTab && (
            <div>
              <label
                style={{ fontFamily: "Cinzel, serif", fontSize: "11px", letterSpacing: "1px" }}
                className="block uppercase mb-2 opacity-75"
              >
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="cosmic_traveler"
                className="input-field"
              />
            </div>
          )}

          <div>
            <label
              style={{ fontFamily: "Cinzel, serif", fontSize: "11px", letterSpacing: "1px" }}
              className="block uppercase mb-2 opacity-75"
            >
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@universe.com"
              className="input-field"
            />
          </div>

          <div>
            <label
              style={{ fontFamily: "Cinzel, serif", fontSize: "11px", letterSpacing: "1px" }}
              className="block uppercase mb-2 opacity-75"
            >
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full flex items-center justify-center py-3.5 mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center space-x-2">
                <svg
                  className="animate-spin h-5 w-5 text-[#0d0a07]"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span style={{ fontFamily: "Cinzel, serif" }}>Aligning Stars...</span>
              </span>
            ) : isLoginTab ? (
              "Reveal My Cosmos"
            ) : (
              "Begin Cosmic Journey"
            )}
          </button>
        </form>

        {/* Bottom Sanskrit decoration */}
        <div
          className="devanagari"
          style={{
            textAlign: "center",
            marginTop: "24px",
            color: "var(--text-dim)",
            fontSize: "12px",
            letterSpacing: "3px"
          }}
        >
          ॐ तत् सत्
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
