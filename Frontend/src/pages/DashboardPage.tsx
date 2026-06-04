import { useState, useEffect, useRef } from "react";
import type { FC, KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";
import axios from "axios";

const API = "http://localhost:8000";

export const DashboardPage: FC = () => {
  const { token, username, logout, profile } = useAuthStore();
  const {
    sessions,
    currentSession,
    messages,
    isStreaming,
    fetchSessions,
    loadSession,
    sendMessage,
    newChat
  } = useChatStore();

  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<"chart" | "transits">("chart");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);

  // Monitor scroll on the chat feed container
  const handleChatScroll = () => {
    const container = chatContainerRef.current;
    if (!container) return;

    // Check if the user is close to the bottom (within 100px)
    const threshold = 100;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;
    shouldAutoScrollRef.current = isAtBottom;
  };

  // Scroll to bottom helper
  const scrollToBottom = (behavior: "smooth" | "auto" = "auto") => {
    const container = chatContainerRef.current;
    if (!container) return;
    if (behavior === "smooth") {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    } else {
      container.scrollTop = container.scrollHeight;
    }
  };

  // Settings modal states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsDate, setSettingsDate] = useState("");
  const [settingsTime, setSettingsTime] = useState("");
  const [settingsPlace, setSettingsPlace] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(false);

  const openSettings = () => {
    setSettingsDate(profile?.birth_date || "");
    setSettingsTime(profile?.birth_time || "");
    setSettingsPlace(profile?.birth_place || "");
    setSettingsError("");
    setIsSettingsOpen(true);
  };

  const handleSaveSettings = async () => {
    if (!settingsDate || !settingsTime || !settingsPlace) {
      setSettingsError("Please fill all fields");
      return;
    }
    setSettingsError("");
    setSettingsLoading(true);
    try {
      await axios.post(`${API}/api/profile/birth-chart`, {
        birth_date: settingsDate,
        birth_time: settingsTime,
        birth_place: settingsPlace
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await useAuthStore.getState().fetchProfile();
      setIsSettingsOpen(false);
    } catch (err: any) {
      setSettingsError(err?.response?.data?.detail || "Could not update birth details");
    } finally {
      setSettingsLoading(false);
    }
  };

  // Monitor screen size
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch sessions on mount
  useEffect(() => {
    if (token) {
      fetchSessions(token);
    }
  }, [token, fetchSessions]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      const isStreamingActive = isStreaming && messages.length > 0 && messages[messages.length - 1].role === "ai";
      scrollToBottom(isStreamingActive ? "auto" : "smooth");
    }
  }, [messages, isStreaming]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming || !token) return;
    const msgText = input;
    setInput("");
    try {
      await sendMessage(msgText, token, currentSession?.id || undefined);
    } catch (err) {
      console.error(err);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleGetTransits = async () => {
    if (isStreaming || !token) return;
    try {
      await sendMessage("What are today's transits for my chart?", token, currentSession?.id || undefined);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  // Helper to format date
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "2-digit"
      });
    } catch {
      return dateStr;
    }
  };

  // Safe placements access
  const placements = profile?.placements || {};

  // Mock active aspects list for demonstration when under transit tab
  const mockAspects = [
    { transit_planet: "Jupiter", aspect: "TRINE", natal_planet: "Moon", orb: "1.2°" },
    { transit_planet: "Saturn", aspect: "OPPOSITION", natal_planet: "Sun", orb: "2.5°" },
    { transit_planet: "Mars", aspect: "CONJUNCTION", natal_planet: "Venus", orb: "0.8°" }
  ];

  const renderSidebarContent = () => (
    <>
      <div className="flex flex-col overflow-y-auto" style={{ flex: 1 }}>
        {/* Logo Section */}
        <div
          onClick={() => {
            newChat();
            setIsSidebarOpen(false);
          }}
          style={{
            padding: "24px",
            cursor: "pointer",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div style={{ fontFamily: "Cinzel", fontSize: "18px", color: "var(--gold)", letterSpacing: "2px" }}>
            ✦ ARADHANA
          </div>
          <p
            style={{
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginTop: "4px",
              textAlign: "center",
              color: "var(--text-muted)",
              fontFamily: "Cinzel, serif",
              fontWeight: 500
            }}
          >
            Jyotish Companion
          </p>
        </div>

        {/* New Consultation Button */}
        <div style={{ padding: "16px" }}>
          <button
            onClick={() => {
              newChat();
              setIsSidebarOpen(false);
            }}
            className="btn-secondary"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px",
              fontSize: "12px",
              fontWeight: 500
            }}
          >
            <span>✦</span> <span>New Consultation</span>
          </button>
        </div>

        {/* Sessions List */}
        <div style={{ padding: "8px 12px 16px 12px" }}>
          <p
            style={{
              fontFamily: "Cinzel, serif",
              color: "var(--text-muted)",
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "1px",
              paddingLeft: "8px",
              marginBottom: "8px",
              fontWeight: "bold",
              opacity: 0.8
            }}
          >
            Consultations
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {sessions.length === 0 ? (
              <p style={{ fontSize: "11px", opacity: 0.4, paddingLeft: "8px", fontStyle: "italic" }}>
                No previous cosmic records
              </p>
            ) : (
              sessions.map((s) => {
                const isActive = currentSession?.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      if (token) loadSession(s.id, token);
                      setIsSidebarOpen(false);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 12px",
                      borderRadius: "var(--radius)",
                      border: "none",
                      background: isActive ? "var(--gold-dim)" : "transparent",
                      color: isActive ? "var(--gold)" : "var(--text-muted)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      fontFamily: "Inter",
                      fontSize: "12px"
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "var(--bg-card)";
                        e.currentTarget.style.color = "var(--text)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--text-muted)";
                      }
                    }}
                  >
                    <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
                      {s.title || "Consultation Record"}
                    </span>
                    <span style={{ fontSize: "9px", opacity: 0.5, display: "block", marginTop: "3px" }}>
                      {formatDate(s.created_at)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* User Profile Footer */}
      <div style={{ padding: "16px", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", overflow: "hidden" }}>
          <span style={{ color: "var(--gold)" }}>✦</span>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {username || "Cosmic Traveler"}
          </span>
        </div>
        <button
          onClick={openSettings}
          className="btn-secondary"
          style={{
            width: "100%",
            textAlign: "center",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: "bold",
            letterSpacing: "0.5px",
            marginBottom: "8px",
            borderColor: "var(--border)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--border-hover)";
            e.currentTarget.style.color = "var(--text)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          ⚙ Settings
        </button>
        <button
          onClick={handleLogout}
          className="btn-ghost"
          style={{
            width: "100%",
            textAlign: "center",
            padding: "8px 12px",
            color: "var(--text-muted)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            background: "rgba(239, 68, 68, 0.02)",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: "bold",
            letterSpacing: "0.5px"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--saffron)";
            e.currentTarget.style.color = "var(--saffron)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.2)";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          Leave Presence
        </button>
      </div>
    </>
  );

  return (
    <div className="dashboard-layout">
      {/* Mobile Drawer Overlay */}
      {isMobile && isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: "fixed",
            zIndex: 95,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(2px)"
          }}
        />
      )}

      {/* 1. LEFT SIDEBAR */}
      <div className={`dashboard-sidebar ${isSidebarOpen ? "open" : ""}`} style={{ zIndex: 100 }}>
        {renderSidebarContent()}
      </div>

      {/* 2. CENTER PANEL (CHAT) */}
      <div className="dashboard-chat">
        {/* Top bar header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {isMobile && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="btn-ghost"
                style={{
                  padding: "6px 10px",
                  fontSize: "18px",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                ☰
              </button>
            )}
            <div>
              <h2 style={{ fontFamily: "Cinzel, serif", color: "var(--gold)", fontSize: "16px", fontWeight: "semibold", letterSpacing: "1px" }}>
                Aradhana
              </h2>
              <p style={{ color: "var(--text-dim)", fontSize: "11px", fontStyle: "italic", marginTop: "2px" }}>
                Your personal Jyotish guide
              </p>
            </div>
          </div>
        </div>

        {/* Message feed */}
        <div
          ref={chatContainerRef}
          onScroll={handleChatScroll}
          style={{ flex: 1, overflowY: "auto", padding: "24px 20px", background: "var(--bg)", display: "flex", flexDirection: "column" }}
        >
          <div style={{ maxWidth: "640px", width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px", flex: 1 }}>
            {messages.length === 0 ? (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                <div style={{ fontSize: "40px", color: "var(--gold)" }}>✦</div>
                <p style={{ fontFamily: "Cinzel, serif", color: "var(--text)", fontSize: "20px", marginTop: "16px", letterSpacing: "1px" }}>
                  Namaste
                </p>
                <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "8px", maxWidth: "320px", lineHeight: "1.6" }}>
                  Ask Aradhana anything about your cosmic journey and planetary alignments.
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: msg.role === "human" ? "flex-end" : "flex-start",
                    animation: "fadeUp 0.3s ease forwards"
                  }}
                >
                  <div
                    style={{
                      maxWidth: "85%",
                      padding: "16px",
                      borderRadius: msg.role === "human" ? "12px 12px 2px 12px" : "2px 12px 12px 12px",
                      background: msg.role === "human" ? "var(--bg-surface)" : "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderLeft: msg.role === "ai" ? "3px solid var(--gold)" : "1px solid var(--border)",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
                    }}
                  >
                    <div className={msg.role === "ai" ? "prose" : ""} style={{ fontSize: "13px", color: "var(--text)", lineHeight: "1.6" }}>
                      {msg.role === "human" ? (
                        <p style={{ whiteSpace: "pre-wrap" }}>{msg.content}</p>
                      ) : (
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Streaming status */}
            {isStreaming && (
              <div style={{ display: "flex", justifyContent: "flex-start", animation: "fadeUp 0.3s ease forwards" }}>
                <div
                  style={{
                    padding: "14px 16px",
                    borderRadius: "2px 12px 12px 12px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderLeft: "3px solid var(--gold)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <span style={{ fontSize: "11px", color: "var(--gold)", fontStyle: "italic" }}>
                    ✦ Channelizing celestial alignments...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input box */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", background: "var(--bg-surface)" }}>
          <div
            style={{
              maxWidth: "640px",
              margin: "0 auto",
              display: "flex",
              alignItems: "flex-end",
              gap: "12px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "8px 12px"
            }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your chart, transits, or cosmic guidance..."
              style={{
                flex: 1,
                resize: "none",
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--text)",
                fontSize: "13px",
                fontFamily: "Inter",
                lineHeight: "1.5",
                padding: "4px 0",
                maxHeight: "120px"
              }}
              rows={2}
            />
            <button
              onClick={handleSend}
              disabled={isStreaming || !input.trim()}
              className="btn-primary"
              style={{
                width: "auto",
                padding: "8px 16px",
                fontSize: "12px"
              }}
            >
              ✦ Ask
            </button>
          </div>
        </div>
      </div>

      {/* 3. RIGHT PANEL */}
      {!isMobile && (
        <div className="dashboard-right-panel">
          {/* Tab switch header */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
            <button
              onClick={() => setActiveTab("chart")}
              style={{
                flex: 1,
                padding: "14px 0",
                background: "transparent",
                border: "none",
                borderBottom: activeTab === "chart" ? "2px solid var(--gold)" : "2px solid transparent",
                color: activeTab === "chart" ? "var(--gold)" : "var(--text-muted)",
                fontSize: "10px",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontFamily: "Cinzel, serif",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              Natal Chart
            </button>
            <button
              onClick={() => setActiveTab("transits")}
              style={{
                flex: 1,
                padding: "14px 0",
                background: "transparent",
                border: "none",
                borderBottom: activeTab === "transits" ? "2px solid var(--gold)" : "2px solid transparent",
                color: activeTab === "transits" ? "var(--gold)" : "var(--text-muted)",
                fontSize: "10px",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontFamily: "Cinzel, serif",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              Transits
            </button>
          </div>

          {/* Tab Contents */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
            {activeTab === "chart" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Prominent Ascendant display */}
                <div className="card" style={{ textAlign: "center", padding: "16px" }}>
                  <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", fontFamily: "Cinzel, serif" }}>
                    Ascendant
                  </p>
                  <p style={{ fontSize: "28px", fontWeight: "bold", marginTop: "8px", color: "var(--gold)", fontFamily: "Cinzel, serif" }}>
                    {profile?.ascendant || "Unknown"}
                  </p>
                  <p style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "6px", fontStyle: "italic" }}>
                    Your rising sign & outer personality
                  </p>
                </div>

                {/* Placements list */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", fontFamily: "Cinzel, serif", fontWeight: "bold" }}>
                    Planetary Positions
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {Object.keys(placements).length === 0 ? (
                      <p style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>
                        Planets still aligning...
                      </p>
                    ) : (
                      Object.entries(placements).map(([planet, details]: any) => (
                        <div key={planet} className="card" style={{ padding: "12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "var(--text-muted)" }}>
                              {planet}
                            </span>
                            <span style={{ fontSize: "12px", fontWeight: "semibold", color: "var(--gold)", fontFamily: "Cinzel, serif" }}>
                              {details.sign}
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", marginTop: "6px", color: "var(--text-dim)" }}>
                            <span>House {details.house}</span>
                            <span>{details.degree}°</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px", height: "100%" }}>
                {/* Get Today's Transits Button */}
                <button
                  onClick={handleGetTransits}
                  disabled={isStreaming}
                  className="btn-primary"
                  style={{ fontSize: "12px", padding: "12px", width: "100%" }}
                >
                  ✦ Get Today's Transits
                </button>

                {/* Transit aspects list */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
                  <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", fontFamily: "Cinzel, serif", fontWeight: "bold" }}>
                    Active Transit Aspects
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {mockAspects.map((aspect, idx) => (
                      <div key={idx} className="card" style={{ padding: "12px" }}>
                        <div
                          style={{
                            fontSize: "11px",
                            fontWeight: "semibold",
                            color: "var(--text)",
                            fontFamily: "Cinzel, serif"
                          }}
                        >
                          {aspect.transit_planet} <span style={{ color: "var(--saffron)" }}>{aspect.aspect}</span> natal {aspect.natal_planet}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", marginTop: "6px", color: "var(--text-dim)" }}>
                          <span>Orb: {aspect.orb}</span>
                          <span style={{ fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.5px", padding: "2px 6px", borderRadius: "4px", background: "var(--gold-dim)", color: "var(--gold)", border: "1px solid var(--border)" }}>
                            Active
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div
          style={{
            position: "fixed",
            zIndex: 200,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px"
          }}
        >
          <div className="card" style={{ width: "100%", maxWidth: "400px", position: "relative" }}>
            <h2 style={{ fontFamily: "Cinzel, serif", color: "var(--gold)", fontSize: "18px", marginBottom: "16px", textAlign: "center" }}>
              ✦ Edit Birth Details
            </h2>

            <div className="field">
              <label className="label">Date of Birth</label>
              <input
                className="input"
                type="date"
                value={settingsDate}
                onChange={(e) => setSettingsDate(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="label">Time of Birth</label>
              <input
                className="input"
                type="time"
                value={settingsTime}
                onChange={(e) => setSettingsTime(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="label">Place of Birth</label>
              <input
                className="input"
                type="text"
                placeholder="City, Country"
                value={settingsPlace}
                onChange={(e) => setSettingsPlace(e.target.value)}
              />
            </div>

            {/* Quick city select inside settings */}
            <div style={{ marginBottom: "20px" }}>
              <p style={{ color: "var(--text-dim)", fontSize: "11px", marginBottom: "8px" }}>
                Quick select:
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {["New Delhi", "Mumbai", "Bangalore", "London", "New York", "Dubai", "Singapore", "Tokyo"].map(city => (
                  <button key={city}
                    onClick={() => setSettingsPlace(city)}
                    style={{
                      background: settingsPlace === city ? "var(--gold-dim)" : "var(--bg-surface)",
                      border: `1px solid ${settingsPlace === city ? "rgba(201,168,76,0.4)" : "var(--border)"}`,
                      color: settingsPlace === city ? "var(--gold)" : "var(--text-muted)",
                      borderRadius: "6px",
                      padding: "5px 10px",
                      fontSize: "11px",
                      cursor: "pointer",
                      fontFamily: "Inter",
                      transition: "all 0.15s"
                    }}>
                    {city}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button
                className="btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setIsSettingsOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={handleSaveSettings}
                disabled={settingsLoading}
              >
                {settingsLoading ? "Saving..." : "Save Details"}
              </button>
            </div>

            {settingsError && <p className="error-text">{settingsError}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
