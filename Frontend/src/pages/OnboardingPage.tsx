import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import axios from "axios";

const CITIES = ["New Delhi", "Mumbai", "Bangalore", "London", "New York", "Dubai", "Singapore", "Tokyo"];
const API = "http://localhost:8000";

export default function OnboardingPage({ onComplete }: { onComplete: () => void }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { token, fetchProfile } = useAuthStore();

  const handleSubmit = async () => {
    if (!date || !time || !place) {
      setError("Please fill all three fields");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await axios.post(`${API}/api/profile/birth-chart`, {
        birth_date: date,
        birth_time: time,
        birth_place: place
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchProfile();
      onComplete();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Could not compute chart. Check your birth details.");
    } finally {
      setLoading(false);
    }
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
      <div style={{ width: "100%", maxWidth: "440px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            fontFamily: "Cinzel",
            fontSize: "20px",
            color: "var(--gold)",
            letterSpacing: "2px",
            marginBottom: "12px"
          }}>✦ ARADHANA</div>
          <h2 style={{
            fontFamily: "Cinzel",
            fontSize: "20px",
            fontWeight: "600",
            color: "var(--text)",
            marginBottom: "8px"
          }}>Your Cosmic Blueprint</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", lineHeight: "1.6" }}>
            Enter your birth details to compute your exact Vedic chart
          </p>
        </div>

        <div className="card">

          <div className="field">
            <label className="label">Date of Birth</label>
            <input className="input" type="date"
              value={date}
              onChange={e => setDate(e.target.value)} />
          </div>

          <div className="field">
            <label className="label">Time of Birth</label>
            <input className="input" type="time"
              value={time}
              onChange={e => setTime(e.target.value)} />
            <p style={{ color: "var(--text-dim)", fontSize: "11px", marginTop: "4px" }}>
              Exact time gives more accurate house positions
            </p>
          </div>

          <div className="field">
            <label className="label">Place of Birth</label>
            <input className="input" type="text"
              placeholder="City, Country"
              value={place}
              onChange={e => setPlace(e.target.value)} />
          </div>

          {/* Quick city select */}
          <div style={{ marginBottom: "20px" }}>
            <p style={{ color: "var(--text-dim)", fontSize: "11px", marginBottom: "8px" }}>
              Quick select:
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {CITIES.map(city => (
                <button key={city}
                  onClick={() => setPlace(city)}
                  style={{
                    background: place === city ? "var(--gold-dim)" : "var(--bg-surface)",
                    border: `1px solid ${place === city ? "rgba(201,168,76,0.4)" : "var(--border)"}`,
                    color: place === city ? "var(--gold)" : "var(--text-muted)",
                    borderRadius: "6px",
                    padding: "5px 10px",
                    fontSize: "12px",
                    cursor: "pointer",
                    fontFamily: "Inter",
                    transition: "all 0.15s"
                  }}>
                  {city}
                </button>
              ))}
            </div>
          </div>

          <button className="btn-primary"
            onClick={handleSubmit}
            disabled={loading}>
            {loading ? "Computing your chart..." : "Calculate My Chart →"}
          </button>

          {error && <p className="error-text">{error}</p>}

        </div>

        <p style={{
          textAlign: "center",
          color: "var(--text-dim)",
          fontSize: "11px",
          marginTop: "16px"
        }}>
          ✦ Chart computed using real Swiss Ephemeris data
        </p>

      </div>
    </div>
  );
}
