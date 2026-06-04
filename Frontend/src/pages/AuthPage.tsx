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
        // Automatically fetch profile after signup
        await fetchProfile();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "#0a0a0f", color: "#e8e0d0", fontFamily: "Georgia, serif" }}
    >
      <div
        className="w-full max-w-md p-8 rounded-2xl shadow-2xl border transition-all duration-300"
        style={{
          backgroundColor: "#13131a",
          borderColor: "#2a2a3a",
          boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
        }}
      >
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-2 animate-pulse" style={{ color: "#c9a84c" }}>
            ✦
          </div>
          <h1 className="text-3xl font-semibold tracking-wider" style={{ color: "#e8e0d0" }}>
            Aradhana
          </h1>
          <p className="text-sm mt-2 opacity-60">Vedic Astrology & Cosmic Blueprint</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b mb-6" style={{ borderColor: "#2a2a3a" }}>
          <button
            type="button"
            className="flex-1 py-3 text-center font-medium transition-colors"
            style={{
              color: isLoginTab ? "#c9a84c" : "#e8e0d0",
              borderBottom: isLoginTab ? "2px solid #c9a84c" : "none",
              opacity: isLoginTab ? 1 : 0.6
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
            className="flex-1 py-3 text-center font-medium transition-colors"
            style={{
              color: !isLoginTab ? "#c9a84c" : "#e8e0d0",
              borderBottom: !isLoginTab ? "2px solid #c9a84c" : "none",
              opacity: !isLoginTab ? 1 : 0.6
            }}
            onClick={() => {
              setIsLoginTab(false);
              setError(null);
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="p-3 mb-6 rounded text-sm border bg-red-950/40"
            style={{ borderColor: "#ef4444", color: "#fca5a5" }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLoginTab && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-75">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="cosmic_traveler"
                className="w-full px-4 py-3 rounded-lg border outline-none bg-transparent transition-all"
                style={{
                  borderColor: "#2a2a3a",
                  color: "#e8e0d0"
                }}
                onFocus={(e) => (e.target.style.borderColor = "#c9a84c")}
                onBlur={(e) => (e.target.style.borderColor = "#2a2a3a")}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-75">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@universe.com"
              className="w-full px-4 py-3 rounded-lg border outline-none bg-transparent transition-all"
              style={{
                borderColor: "#2a2a3a",
                color: "#e8e0d0"
              }}
              onFocus={(e) => (e.target.style.borderColor = "#c9a84c")}
              onBlur={(e) => (e.target.style.borderColor = "#2a2a3a")}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-75">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg border outline-none bg-transparent transition-all"
              style={{
                borderColor: "#2a2a3a",
                color: "#e8e0d0"
              }}
              onFocus={(e) => (e.target.style.borderColor = "#c9a84c")}
              onBlur={(e) => (e.target.style.borderColor = "#2a2a3a")}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-lg font-semibold tracking-wider transition-all disabled:opacity-50 text-black hover:scale-[1.01]"
            style={{
              backgroundColor: "#c9a84c",
              boxShadow: "0 4px 15px rgba(201, 168, 76, 0.3)"
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center space-x-2">
                <svg
                  className="animate-spin h-5 w-5 text-black"
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
                <span>Entering Orbit...</span>
              </span>
            ) : isLoginTab ? (
              "Reveal My Cosmos"
            ) : (
              "Begin Cosmic Journey"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
