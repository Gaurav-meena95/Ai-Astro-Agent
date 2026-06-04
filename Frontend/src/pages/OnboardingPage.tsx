import React, { useState } from "react";
import axios from "axios";
import { useAuthStore } from "../store/authStore";

export const OnboardingPage: React.FC = () => {
  const { token, fetchProfile } = useAuthStore();
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quickCities = ["New Delhi", "Mumbai", "London", "New York", "Tokyo", "Dubai"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthDate || !birthTime || !birthPlace) {
      setError("Please fill out all fields.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await axios.post(
        "http://localhost:8000/api/profile/birth-chart",
        {
          birth_date: birthDate,
          birth_time: birthTime,
          birth_place: birthPlace
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      await fetchProfile();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to compute birth chart. Please check your inputs.");
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

      {/* Onboarding Card */}
      <div className="card w-full max-w-[480px] relative z-10 shadow-2xl">
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div className="logo">✦ ARADHANA</div>
          <div className="divider" style={{ marginTop: "16px", marginBottom: "16px" }} />
          <h2 style={{ fontFamily: "Cinzel, serif", fontSize: "18px", color: "var(--text-primary)", marginTop: "16px" }}>
            Your Cosmic Blueprint
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "8px" }}>
            The stars remember the moment you arrived
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{ color: "var(--saffron)", borderColor: "var(--saffron-dim)" }}
            className="p-3 mb-6 rounded text-sm border bg-red-950/20 text-center"
          >
            {error}
          </div>
        )}

        {/* Onboarding Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                style={{ fontFamily: "Cinzel, serif", fontSize: "11px", letterSpacing: "1px" }}
                className="block uppercase mb-2 opacity-75"
              >
                Date of Birth
              </label>
              <input
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="input-field"
                style={{ colorScheme: "dark" }}
              />
            </div>

            <div>
              <label
                style={{ fontFamily: "Cinzel, serif", fontSize: "11px", letterSpacing: "1px" }}
                className="block uppercase mb-2 opacity-75"
              >
                Time of Birth
              </label>
              <input
                type="time"
                required
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                className="input-field"
                style={{ colorScheme: "dark" }}
              />
            </div>
          </div>

          <div>
            <label
              style={{ fontFamily: "Cinzel, serif", fontSize: "11px", letterSpacing: "1px" }}
              className="block uppercase mb-2 opacity-75"
            >
              Place of Birth
            </label>
            <input
              type="text"
              required
              value={birthPlace}
              onChange={(e) => setBirthPlace(e.target.value)}
              placeholder="City, Country"
              className="input-field"
            />
            {/* Quick Cities Select */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
              {quickCities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setBirthPlace(city)}
                  className="btn-outline text-xs"
                  style={{
                    fontSize: "12px",
                    padding: "6px 12px",
                    borderColor: birthPlace === city ? "var(--gold-primary)" : "var(--gold-dim)",
                    color: birthPlace === city ? "var(--gold-light)" : "var(--gold-primary)",
                    backgroundColor: birthPlace === city ? "var(--glow)" : "transparent"
                  }}
                >
                  {city}
                </button>
              ))}
            </div>
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
                <span style={{ fontFamily: "Cinzel, serif" }}>Reading cosmic patterns...</span>
              </span>
            ) : (
              "✦ Calculate My Chart"
            )}
          </button>
        </form>

        {/* Bottom Sanskrit quote */}
        <div
          className="devanagari text-center"
          style={{
            color: "var(--text-dim)",
            fontSize: "12px",
            marginTop: "24px",
            letterSpacing: "1px"
          }}
        >
          जातकं फलितं चैव होरा च गणितं तथा
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
