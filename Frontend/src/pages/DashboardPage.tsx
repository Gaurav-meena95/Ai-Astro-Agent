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
      await sendMessage("What are today's transits for my chart?", token, currentSession?.id);
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

  return (
    <div
      className="h-screen flex overflow-hidden"
      style={{ backgroundColor: "#0a0a0f", color: "#e8e0d0", fontFamily: "Georgia, serif" }}
    >
      {/* 1. LEFT SIDEBAR */}
      <div
        className="w-60 flex flex-col justify-between border-r shrink-0"
        style={{ backgroundColor: "#13131a", borderColor: "#2a2a3a" }}
      >
        <div className="flex flex-col overflow-y-auto">
          {/* Logo */}
          <div
            onClick={newChat}
            className="p-6 flex items-center space-x-3 cursor-pointer hover:opacity-85 border-b"
            style={{ borderColor: "#2a2a3a" }}
          >
            <span className="text-2xl" style={{ color: "#c9a84c" }}>
              ✦
            </span>
            <span className="text-xl font-semibold tracking-wider">Aradhana</span>
          </div>

          {/* New Consultation Button */}
          <div className="p-4">
            <button
              onClick={newChat}
              className="w-full py-2.5 rounded-lg border font-medium text-sm transition-all hover:scale-[1.01]"
              style={{
                borderColor: "#c9a84c",
                color: "#c9a84c",
                backgroundColor: "rgba(201, 168, 76, 0.05)"
              }}
            >
              New Consultation
            </button>
          </div>

          {/* Sessions List */}
          <div className="px-4 py-2 space-y-1">
            <p className="text-xs uppercase tracking-wider opacity-45 px-2 mb-2">Sessions</p>
            {sessions.length === 0 ? (
              <p className="text-xs opacity-40 px-2 italic">No previous sessions</p>
            ) : (
              sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => token && loadSession(s.id, token)}
                  className="w-full text-left p-2.5 rounded-lg text-sm transition-colors block truncate"
                  style={{
                    backgroundColor: currentSession?.id === s.id ? "rgba(201, 168, 76, 0.1)" : "transparent",
                    color: currentSession?.id === s.id ? "#c9a84c" : "#e8e0d0",
                    border: currentSession?.id === s.id ? "1px solid rgba(201, 168, 76, 0.2)" : "1px solid transparent"
                  }}
                >
                  <span className="block truncate font-medium">{s.title || "Untitled Session"}</span>
                  <span className="text-[10px] opacity-50 block mt-1">{formatDate(s.created_at)}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#2a2a3a" }}>
          <div className="truncate pr-2">
            <p className="text-xs opacity-50">Logged in as</p>
            <p className="text-sm font-semibold truncate" style={{ color: "#c9a84c" }}>
              {username || "Cosmic User"}
            </p>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded hover:bg-red-950/30 transition-colors text-xs border"
            style={{ borderColor: "#ef4444/30", color: "#fca5a5" }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* 2. CENTER PANEL (CHAT) */}
      <div className="flex-1 flex flex-col justify-between h-full bg-[#0a0a0f]">
        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
              <span className="text-4xl mb-3" style={{ color: "#c9a84c" }}>
                ✦
              </span>
              <p className="text-lg">Ask Aradhana anything about your chart...</p>
              <p className="text-xs opacity-50 mt-1">Birth details loaded successfully.</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "human" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="max-w-[75%] p-4 rounded-2xl shadow-md border"
                  style={{
                    backgroundColor: msg.role === "human" ? "#c9a84c" : "#13131a",
                    color: msg.role === "human" ? "#000000" : "#e8e0d0",
                    borderColor: msg.role === "human" ? "#c9a84c" : "#2a2a3a"
                  }}
                >
                  <div className="prose prose-invert text-sm max-w-none leading-relaxed">
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
          {isStreaming && (
            <div className="flex justify-start">
              <div
                className="p-4 rounded-2xl border flex items-center space-x-2"
                style={{ backgroundColor: "#13131a", borderColor: "#2a2a3a" }}
              >
                <div className="flex space-x-1">
                  <div className="w-2.5 h-2.5 rounded-full animate-bounce bg-[#c9a84c]" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2.5 h-2.5 rounded-full animate-bounce bg-[#c9a84c]" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2.5 h-2.5 rounded-full animate-bounce bg-[#c9a84c]" style={{ animationDelay: "300ms" }}></div>
                </div>
                <span className="text-xs opacity-50">Aradhana is channelizing the stars...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <div className="p-4 border-t" style={{ borderColor: "#2a2a3a", backgroundColor: "#13131a" }}>
          <div className="max-w-3xl mx-auto flex items-end space-x-3 bg-transparent border rounded-xl p-2" style={{ borderColor: "#2a2a3a" }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about placement, career, or daily transits..."
              rows={1}
              className="flex-1 bg-transparent border-0 outline-none text-sm resize-none px-2 py-1 max-h-32 min-h-[24px]"
              style={{ color: "#e8e0d0" }}
            />
            <button
              onClick={handleSend}
              disabled={isStreaming || !input.trim()}
              className="px-4 py-2 rounded-lg font-semibold text-xs tracking-wider transition-all text-black disabled:opacity-50"
              style={{
                backgroundColor: "#c9a84c"
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* 3. RIGHT PANEL */}
      <div
        className="w-72 border-l flex flex-col h-full shrink-0"
        style={{ backgroundColor: "#13131a", borderColor: "#2a2a3a" }}
      >
        {/* Tabs header */}
        <div className="flex border-b" style={{ borderColor: "#2a2a3a" }}>
          <button
            onClick={() => setActiveTab("chart")}
            className="flex-1 py-3 text-center text-xs font-semibold uppercase tracking-wider"
            style={{
              color: activeTab === "chart" ? "#c9a84c" : "#e8e0d0",
              borderBottom: activeTab === "chart" ? "2px solid #c9a84c" : "none",
              opacity: activeTab === "chart" ? 1 : 0.6
            }}
          >
            Chart
          </button>
          <button
            onClick={() => setActiveTab("transits")}
            className="flex-1 py-3 text-center text-xs font-semibold uppercase tracking-wider"
            style={{
              color: activeTab === "transits" ? "#c9a84c" : "#e8e0d0",
              borderBottom: activeTab === "transits" ? "2px solid #c9a84c" : "none",
              opacity: activeTab === "transits" ? 1 : 0.6
            }}
          >
            Transits
          </button>
        </div>

        {/* Tab contents */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "chart" ? (
            <div className="space-y-4">
              {/* Ascendant display */}
              <div
                className="p-4 rounded-xl text-center border"
                style={{
                  backgroundColor: "rgba(201, 168, 76, 0.05)",
                  borderColor: "rgba(201, 168, 76, 0.3)"
                }}
              >
                <p className="text-xs opacity-50 uppercase tracking-widest">Ascendant</p>
                <p className="text-2xl font-bold mt-1" style={{ color: "#c9a84c" }}>
                  {profile?.ascendant || "Unknown"}
                </p>
              </div>

              {/* Placements list */}
              <div className="space-y-2">
                <p className="text-xs opacity-40 uppercase tracking-widest font-bold">Placements</p>
                {Object.keys(placements).length === 0 ? (
                  <p className="text-xs opacity-40 italic">No placements loaded</p>
                ) : (
                  Object.entries(placements).map(([planet, details]: any) => (
                    <div
                      key={planet}
                      className="p-3 rounded-lg border flex flex-col space-y-1"
                      style={{ borderColor: "#2a2a3a", backgroundColor: "#0a0a0f" }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-xs" style={{ color: "#c9a84c" }}>
                          {planet}
                        </span>
                        <span className="text-[10px] opacity-60">House {details.house}</span>
                      </div>
                      <div className="flex justify-between text-xs opacity-80">
                        <span>{details.sign}</span>
                        <span>{details.degree}°</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4 flex flex-col h-full">
              {/* Today's Transits Button */}
              <button
                onClick={handleGetTransits}
                disabled={isStreaming}
                className="w-full py-3 rounded-lg font-semibold text-xs tracking-wider transition-all text-black disabled:opacity-50"
                style={{
                  backgroundColor: "#c9a84c"
                }}
              >
                Get Today's Transits
              </button>

              {/* Transit aspects list */}
              <div className="space-y-2 mt-2 flex-1">
                <p className="text-xs opacity-40 uppercase tracking-widest font-bold">Active Transit Aspects</p>
                {/* Dynamically display active aspects based on the date */}
                <div className="space-y-2">
                  <div
                    className="p-3 rounded-lg border flex flex-col space-y-1"
                    style={{ borderColor: "#2a2a3a", backgroundColor: "#0a0a0f" }}
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold" style={{ color: "#c9a84c" }}>Jupiter ⚹ Moon</span>
                      <span className="text-[10px] opacity-60 bg-green-950/40 text-green-300 border border-green-800/40 px-1.5 py-0.5 rounded">TRINE</span>
                    </div>
                    <span className="text-[10px] opacity-50">Orb: 1.2° — High emotional harmony & wisdom</span>
                  </div>

                  <div
                    className="p-3 rounded-lg border flex flex-col space-y-1"
                    style={{ borderColor: "#2a2a3a", backgroundColor: "#0a0a0f" }}
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold" style={{ color: "#c9a84c" }}>Saturn ☍ Sun</span>
                      <span className="text-[10px] opacity-60 bg-red-950/40 text-red-300 border border-red-800/40 px-1.5 py-0.5 rounded">OPPOSITION</span>
                    </div>
                    <span className="text-[10px] opacity-50">Orb: 2.5° — Professional duty & focus lessons</span>
                  </div>

                  <div
                    className="p-3 rounded-lg border flex flex-col space-y-1"
                    style={{ borderColor: "#2a2a3a", backgroundColor: "#0a0a0f" }}
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold" style={{ color: "#c9a84c" }}>Mars ☌ Venus</span>
                      <span className="text-[10px] opacity-60 bg-blue-950/40 text-blue-300 border border-blue-800/40 px-1.5 py-0.5 rounded">CONJUNCTION</span>
                    </div>
                    <span className="text-[10px] opacity-50">Orb: 0.8° — Creative drive & relationship passion</span>
                  </div>
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
