
export default function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "var(--bg)"
    }}>
      
      {/* Navbar */}
      <nav style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 40px",
        borderBottom: "1px solid var(--border)"
      }}>
        <div style={{
          fontFamily: "Cinzel",
          fontSize: "18px",
          color: "var(--gold)",
          letterSpacing: "2px"
        }}>
          ✦ ARADHANA
        </div>
        <button className="btn-secondary" 
          style={{ width: "auto", padding: "8px 20px" }}
          onClick={onGetStarted}>
          Sign In
        </button>
      </nav>

      {/* Hero */}
      <main style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 24px",
        textAlign: "center",
        maxWidth: "640px",
        margin: "0 auto"
      }}>
        
        <div className="fade-up" style={{ animationDelay: "0s" }}>
          <div style={{
            display: "inline-block",
            background: "var(--gold-dim)",
            border: "1px solid rgba(201,168,76,0.2)",
            borderRadius: "20px",
            padding: "6px 16px",
            fontSize: "12px",
            color: "var(--gold)",
            marginBottom: "28px",
            letterSpacing: "0.5px"
          }}>
            ✦ Powered by Real Vedic Ephemeris
          </div>
        </div>

        <h1 className="fade-up" style={{
          fontFamily: "Cinzel",
          fontSize: "clamp(32px, 5vw, 52px)",
          fontWeight: "600",
          color: "var(--text)",
          lineHeight: "1.2",
          marginBottom: "20px",
          animationDelay: "0.1s"
        }}>
          Your Personal<br />
          <span style={{ color: "var(--gold)" }}>Jyotish Guide</span>
        </h1>

        <p className="fade-up" style={{
          fontSize: "16px",
          color: "var(--text-muted)",
          lineHeight: "1.7",
          marginBottom: "40px",
          maxWidth: "480px",
          animationDelay: "0.2s"
        }}>
          Compute your exact Vedic birth chart from real planetary 
          positions, get daily transit readings, and receive 
          personalized cosmic guidance — all in one conversation.
        </p>

        <div className="fade-up" style={{ animationDelay: "0.3s", width: "100%", maxWidth: "280px" }}>
          <button className="btn-primary" onClick={onGetStarted}
            style={{ fontSize: "15px", padding: "14px 20px" }}>
            Get Your Free Chart →
          </button>
          <p style={{ color: "var(--text-dim)", fontSize: "12px", marginTop: "12px" }}>
            No credit card required
          </p>
        </div>

      </main>

      {/* Features row */}
      <section style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "1px",
        borderTop: "1px solid var(--border)",
        background: "var(--border)"
      }}>
        {[
          { icon: "🪐", title: "Real Ephemeris", desc: "Exact planetary positions, not guesses" },
          { icon: "🏠", title: "12 Houses", desc: "Placidus house system with Vedic interpretation" },
          { icon: "⚡", title: "Live Transits", desc: "Today's planetary energy for your chart" },
          { icon: "🔒", title: "Private", desc: "Your data stays yours, always" }
        ].map(f => (
          <div key={f.title} style={{
            background: "var(--bg)",
            padding: "28px 24px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "24px", marginBottom: "10px" }}>{f.icon}</div>
            <div style={{ fontWeight: "500", fontSize: "14px", marginBottom: "6px" }}>{f.title}</div>
            <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>{f.desc}</div>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer style={{
        textAlign: "center",
        padding: "20px",
        color: "var(--text-dim)",
        fontSize: "12px",
        borderTop: "1px solid var(--border)"
      }}>
        ✦ ARADHANA · जातकं फलितं चैव
      </footer>

    </div>
  );
}
