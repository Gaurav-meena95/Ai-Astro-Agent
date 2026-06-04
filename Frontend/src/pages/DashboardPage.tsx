import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";

export const DashboardPage: React.FC = () => {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch sessions on mount
  useEffect(() => {
    if (token) {
      fetchSessions(token);
    }
  }, [token, fetchSessions]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming || !token) return;
    const msgText = input;
    setInput("");
    try {
      await sendMessage(msgText, token, currentSession?.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleGetTransits = async () => {
    if (isStreaming || !token) return;
    try {
      await sendMessage("What are today's transits and how do they affect my chart?", token, currentSession?.id);
    } catch (err) {
      console.error(err);
    }
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
  const houses = profile?.houses || {};

  // Mock active aspects list for demonstration when under transit tab
  const mockAspects = [
    { transit_planet: "Jupiter", aspect: "TRINE", natal_planet: "Moon", orb: "1.2°" },
    { transit_planet: "Saturn", aspect: "OPPOSITION", natal_planet: "Sun", orb: "2.5°" },
    { transit_planet: "Mars", aspect: "CONJUNCTION", natal_planet: "Venus", orb: "0.8°" }
  ];

  return (
    <div
      className="h-screen w-full overflow-hidden"
      style={{
        display: "grid",
        gridTemplateColumns: "240px 1fr 280px",
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)"
      }}
    >
      {/* 1. LEFT SIDEBAR */}
      <div
        className="flex flex-col justify-between h-full border-r relative z-10"
        style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-col overflow-y-auto">
          {/* Logo Section */}
          <div
            onClick={newChat}
            className="p-6 cursor-pointer border-b flex flex-col justify-center items-center"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="logo text-xl">✦ ARADHANA</div>
            <p
              className="text-[10px] uppercase tracking-widest mt-1 text-center font-medium"
              style={{ color: "var(--text-secondary)", fontFamily: "Cinzel, serif" }}
            >
              Jyotish Companion
            </p>
          </div>

          {/* New Consultation Button */}
          <div className="p-4">
            <button
              onClick={newChat}
              className="btn-outline w-full flex items-center justify-center space-x-1 py-2.5 text-xs uppercase font-bold tracking-wider"
            >
              <span>✦</span> <span>New Consultation</span>
            </button>
          </div>

          {/* Sessions List */}
          <div className="px-3 py-2 space-y-1">
            <p
              style={{ fontFamily: "Cinzel, serif", color: "var(--text-secondary)" }}
              className="text-[10px] uppercase tracking-wider px-2 mb-2 font-bold opacity-75"
            >
              Consultations
            </p>
            <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
              {sessions.length === 0 ? (
                <p className="text-[11px] opacity-40 px-2 italic font-serif">No previous cosmic records</p>
              ) : (
                sessions.map((s) => {
                  const isActive = currentSession?.id === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => token && loadSession(s.id, token)}
                      className="w-full text-left p-3 rounded-lg text-xs transition-all block truncate slide-in"
                      style={{
                        backgroundColor: isActive ? "var(--glow)" : "transparent",
                        color: isActive ? "var(--gold-primary)" : "var(--text-primary)",
                        borderLeft: isActive ? "2px solid var(--gold-primary)" : "2px solid transparent",
                        borderColor: isActive ? "var(--gold-primary)" : "transparent"
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = "var(--bg-card)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <span className="block truncate font-semibold">{s.title || "Consultation Record"}</span>
                      <span className="text-[9px] opacity-50 block mt-1">{formatDate(s.created_at)}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t flex flex-col space-y-3" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center space-x-2 truncate">
            <span style={{ color: "var(--gold-primary)" }} className="text-sm">✦</span>
            <span className="text-xs font-semibold truncate" style={{ color: "var(--text-secondary)" }}>
              {username || "Cosmic Traveler"}
            </span>
          </div>
          <button
            onClick={logout}
            className="w-full py-1.5 rounded text-[11px] border font-bold uppercase tracking-wider transition-colors hover:text-[#ff6b00]"
            style={{
              borderColor: "rgba(239, 68, 68, 0.2)",
              color: "var(--text-dim)",
              backgroundColor: "rgba(239, 68, 68, 0.02)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--saffron)";
              e.currentTarget.style.color = "var(--saffron)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.2)";
              e.currentTarget.style.color = "var(--text-dim)";
            }}
          >
            Leave Presence
          </button>
        </div>
      </div>

      {/* 2. CENTER PANEL (CHAT) */}
      <div className="flex flex-col justify-between h-full relative z-10">
        {/* Top bar header */}
        <div
          className="px-6 py-4 border-b flex flex-col justify-center"
          style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border)" }}
        >
          <h2 style={{ fontFamily: "Cinzel, serif", color: "var(--gold-primary)", fontSize: "16px" }} className="font-semibold tracking-wider">
            Aradhana
          </h2>
          <p style={{ color: "var(--text-dim)", fontSize: "11px" }} className="italic mt-0.5">
            Your personal Jyotish guide
          </p>
        </div>

        {/* Message feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ backgroundColor: "var(--bg-primary)" }}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div
                style={{ fontSize: "48px", animation: "pulse-glow 3s infinite", color: "var(--gold-primary)" }}
              >
                ✦
              </div>
              <p style={{ fontFamily: "Cinzel, serif", color: "var(--text-primary)" }} className="text-xl mt-4 tracking-wider">
                Namaste
              </p>
              <p style={{ color: "var(--text-secondary)" }} className="text-xs mt-2 max-w-sm leading-relaxed">
                Ask Aradhana anything about your cosmic journey and planetary alignments.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "human" ? "justify-end" : "justify-start"} fade-in`}
              >
                <div
                  className="max-w-[75%] p-4 shadow-lg border"
                  style={{
                    background: msg.role === "human"
                      ? "linear-gradient(135deg, var(--saffron-dim), var(--gold-dim))"
                      : "var(--bg-card)",
                    color: "var(--text-primary)",
                    borderColor: msg.role === "human" ? "var(--saffron-dim)" : "var(--border)",
                    borderLeft: msg.role === "ai" ? "3px solid var(--gold-primary)" : undefined,
                    borderRadius: msg.role === "human" ? "16px 16px 4px 16px" : "4px 16px 16px 16px"
                  }}
                >
                  <div className="prose prose-invert text-xs leading-relaxed max-w-none">
                    {msg.role === "human" ? (
                      <p className="whitespace-pre-line font-serif">{msg.content}</p>
                    ) : (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Streaming dots */}
          {isStreaming && (
            <div className="flex justify-start fade-in">
              <div
                className="p-4 rounded-xl border flex items-center space-x-2"
                style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
              >
                <span className="animate-pulse text-xs" style={{ color: "var(--gold-primary)" }}>✦</span>
                <span className="animate-pulse text-xs" style={{ color: "var(--gold-primary)", animationDelay: "200ms" }}>✦</span>
                <span className="animate-pulse text-xs" style={{ color: "var(--gold-primary)", animationDelay: "400ms" }}>✦</span>
                <span className="text-[10px] text-dim ml-2 italic">Aradhana is channelizing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input box */}
        <div
          className="p-4 border-t"
          style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border)" }}
        >
          <div className="max-w-3xl mx-auto flex items-end space-x-3 bg-transparent border rounded-xl p-2" style={{ borderColor: "var(--border)" }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your chart, transits, or cosmic guidance..."
              className="input-field"
              style={{
                resize: "none",
                background: "transparent",
                border: "none",
                padding: "8px",
                fontSize: "13px"
              }}
              rows={2}
            />
            <button onClick={handleSend} disabled={isStreaming || !input.trim()} className="btn-gold px-6">
              ✦ Ask
            </button>
          </div>
        </div>
      </div>

      {/* 3. RIGHT PANEL */}
      <div
        className="flex flex-col h-full border-l relative z-10"
        style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border)" }}
      >
        {/* Tab switch header */}
        <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={() => setActiveTab("chart")}
            className="flex-1 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider"
            style={{
              color: activeTab === "chart" ? "var(--gold-primary)" : "var(--text-secondary)",
              borderBottom: activeTab === "chart" ? "2px solid var(--gold-primary)" : "none",
              fontFamily: "Cinzel, serif"
            }}
          >
            Natal Chart
          </button>
          <button
            onClick={() => setActiveTab("transits")}
            className="flex-1 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider"
            style={{
              color: activeTab === "transits" ? "var(--gold-primary)" : "var(--text-secondary)",
              borderBottom: activeTab === "transits" ? "2px solid var(--gold-primary)" : "none",
              fontFamily: "Cinzel, serif"
            }}
          >
            Transits
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "chart" ? (
            <div className="space-y-5">
              {/* Prominent Ascendant display */}
              <div className="card text-center relative overflow-hidden">
                <p
                  className="text-[10px] uppercase tracking-widest font-semibold"
                  style={{ color: "var(--text-secondary)", fontFamily: "Cinzel, serif" }}
                >
                  Ascendant
                </p>
                <p className="text-3xl font-bold mt-2" style={{ color: "var(--gold-primary)", fontFamily: "Cinzel, serif" }}>
                  {profile?.ascendant || "Unknown"}
                </p>
                <p className="text-[10px] text-dim mt-1.5 italic">Your rising sign & outer personality</p>
              </div>

              <div className="divider" />

              {/* Placements list */}
              <div className="space-y-3">
                <p
                  className="text-[10px] uppercase tracking-wider font-bold"
                  style={{ color: "var(--text-secondary)", fontFamily: "Cinzel, serif" }}
                >
                  Planetary Positions
                </p>
                <div className="grid grid-cols-1 gap-2.5">
                  {Object.keys(placements).length === 0 ? (
                    <p className="text-xs opacity-40 italic font-serif">Planets still aligning...</p>
                  ) : (
                    Object.entries(placements).map(([planet, details]: any) => (
                      <div key={planet} className="card" style={{ padding: "12px" }}>
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-bold uppercase" style={{ color: "var(--text-secondary)" }}>
                            {planet}
                          </span>
                          <span
                            className="text-xs font-semibold"
                            style={{ color: "var(--gold-primary)", fontFamily: "Cinzel, serif" }}
                          >
                            {details.sign}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] mt-1.5" style={{ color: "var(--text-dim)" }}>
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
            <div className="space-y-5 flex flex-col h-full">
              {/* Get Today's Transits Button */}
              <button
                onClick={handleGetTransits}
                disabled={isStreaming}
                className="btn-gold w-full text-xs py-3"
              >
                ✦ Today's Transits
              </button>

              {/* Transit aspects list */}
              <div className="space-y-3 flex-1">
                <p
                  className="text-[10px] uppercase tracking-wider font-bold"
                  style={{ color: "var(--text-secondary)", fontFamily: "Cinzel, serif" }}
                >
                  Active Transit Aspects
                </p>
                <div className="space-y-2.5">
                  {mockAspects.map((aspect, idx) => (
                    <div key={idx} className="card" style={{ padding: "12px" }}>
                      <div
                        className="text-[11px] font-semibold tracking-wide"
                        style={{ color: "var(--text-primary)", fontFamily: "Cinzel, serif" }}
                      >
                        {aspect.transit_planet} <span style={{ color: "var(--saffron)" }}>{aspect.aspect}</span> natal {aspect.natal_planet}
                      </div>
                      <div className="flex justify-between items-center text-[10px] mt-1.5" style={{ color: "var(--text-dim)" }}>
                        <span>Orb: {aspect.orb}</span>
                        <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(212,160,23,0.08)", color: "var(--gold-primary)", border: "1px solid var(--border)" }}>
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
    </div>
  );
};

export default DashboardPage;
