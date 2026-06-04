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
      
      // Auto-fetch profile after creation to update onboarding state
      await fetchProfile();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to compute birth chart. Please check your inputs.");
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
        className="w-full max-w-lg p-8 rounded-2xl shadow-2xl border"
        style={{
          backgroundColor: "#13131a",
          borderColor: "#2a2a3a",
          boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
        }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-2" style={{ color: "#c9a84c" }}>
            ✦
          </div>
          <h1 className="text-3xl font-semibold tracking-wider" style={{ color: "#e8e0d0" }}>
            Let's map your cosmic blueprint
          </h1>
          <p className="text-sm mt-3 opacity-60">
            Your birth chart is the foundation of your reading
          </p>
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

        {/* Onboarding Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-75">
                Birth Date
              </label>
              <input
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border outline-none bg-transparent transition-all"
                style={{
                  borderColor: "#2a2a3a",
                  color: "#e8e0d0",
                  colorScheme: "dark"
                }}
                onFocus={(e) => (e.target.style.borderColor = "#c9a84c")}
                onBlur={(e) => (e.target.style.borderColor = "#2a2a3a")}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-75">
                Birth Time
              </label>
              <input
                type="time"
                required
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border outline-none bg-transparent transition-all"
                style={{
                  borderColor: "#2a2a3a",
                  color: "#e8e0d0",
                  colorScheme: "dark"
                }}
                onFocus={(e) => (e.target.style.borderColor = "#c9a84c")}
                onBlur={(e) => (e.target.style.borderColor = "#2a2a3a")}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-75">
              Birth Place
            </label>
            <input
              type="text"
              required
              value={birthPlace}
              onChange={(e) => setBirthPlace(e.target.value)}
              placeholder="City, Country"
              className="w-full px-4 py-3 rounded-lg border outline-none bg-transparent transition-all mb-3"
              style={{
                borderColor: "#2a2a3a",
                color: "#e8e0d0"
              }}
              onFocus={(e) => (e.target.style.borderColor = "#c9a84c")}
              onBlur={(e) => (e.target.style.borderColor = "#2a2a3a")}
            />
            {/* Quick Cities Select */}
            <div className="flex flex-wrap gap-2">
              {quickCities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setBirthPlace(city)}
                  className="px-3 py-1 text-xs rounded-full border transition-colors hover:scale-[1.03]"
                  style={{
                    borderColor: birthPlace === city ? "#c9a84c" : "#2a2a3a",
                    color: birthPlace === city ? "#c9a84c" : "#e8e0d0",
                    backgroundColor: birthPlace === city ? "rgba(201, 168, 76, 0.1)" : "transparent"
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
            className="w-full py-4 rounded-lg font-semibold tracking-wider transition-all disabled:opacity-50 text-black hover:scale-[1.01]"
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
                <span>Computing your birth chart...</span>
              </span>
            ) : (
              "Calculate My Chart"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage;
