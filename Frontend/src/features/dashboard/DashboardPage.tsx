import React, { useEffect, useState, useRef } from "react";
import { useAuthStore } from "../../store/authStore";
import { useChatStore } from "../../store/chatStore";
import {
  LogOut,
  Sparkles,
  MessageSquare,
  ChevronRight,
  Send,
  Compass,
  Star,
  User,
  Activity,
  Plus,
  Loader2,
  Calendar,
  Clock,
  MapPin
} from "lucide-react";
import api from "../../services/api";

export const DashboardPage: React.FC = () => {
  const { profile, logout } = useAuthStore();
  const {
    sessions,
    activeSessionId,
    activeMessages,
    isStreaming,
    isLoading,
    fetchSessions,
    createSession,
    selectSession,
    sendMessage
  } = useChatStore();

  const [activeTab, setActiveTab] = useState<"chat" | "chart" | "transits">("chat");
  const [inputText, setInputText] = useState("");
  const [transits, setTransits] = useState<Record<string, any>>({});
  const [isLoadingTransits, setIsLoadingTransits] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize and pull sessions list
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Scroll active chat screen dynamically when new tokens stream in
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  // Lazy-load transits list only when selected
  useEffect(() => {
    if (activeTab === "transits" && Object.keys(transits).length === 0) {
      const loadTransits = async () => {
        setIsLoadingTransits(true);
        try {
          const response = await api.get("/api/transits/daily");
          setTransits(response.data.transits || {});
        } catch (e) {
          console.error("Transits loading error:", e);
        } finally {
          setIsLoadingTransits(false);
        }
      };
      loadTransits();
    }
  }, [activeTab, transits]);

  const handleCreateSession = async () => {
    const sId = await createSession();
    if (sId) {
      setActiveTab("chat");
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isStreaming) return;
    const text = inputText;
    setInputText("");
    await sendMessage(text);
  };

  return (
    <div className="min-h-screen w-full bg-space-950 flex flex-col md:flex-row relative text-gray-200 overflow-hidden">
      {/* Decorative Nebula Glow */}
      <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-purple-950/10 rounded-full blur-[160px] pointer-events-none" />

      {/* 1. SIDEBAR (Chat History Selector) */}
      <aside className="w-full md:w-64 bg-space-900 border-b md:border-b-0 md:border-r border-purple-900/15 flex flex-col justify-between shrink-0">
        <div className="p-4 flex flex-col h-full overflow-hidden">
          {/* Dashboard Header Logo */}
          <div className="flex items-center space-x-2.5 mb-6 px-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white tracking-wide text-md">AstroAgent</span>
          </div>

          {/* New consultation button */}
          <button
            onClick={handleCreateSession}
            disabled={isLoading}
            className="w-full py-2 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs flex items-center justify-center space-x-1.5 transition-all mb-4 shadow-md shadow-purple-950/40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Consultation</span>
          </button>

          {/* History Lists */}
          <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-2 px-1">
            Consultations Log
          </p>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {sessions.map((s) => (
              <button
                key={s.session_id}
                onClick={() => {
                  selectSession(s.session_id);
                  setActiveTab("chat");
                }}
                className={`w-full text-left py-2 px-3 rounded-lg text-xs flex items-center justify-between group transition-all ${
                  activeSessionId === s.session_id
                    ? "bg-purple-900/20 text-purple-200 border border-purple-500/20"
                    : "text-gray-400 hover:bg-space-800 hover:text-white border border-transparent"
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{s.title}</span>
                </div>
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            ))}
            
            {sessions.length === 0 && (
              <div className="text-[11px] text-gray-500 italic p-3 text-center">
                No past consultations found.
              </div>
            )}
          </div>
        </div>

        {/* Footer Area */}
        <div className="p-4 border-t border-purple-900/10 bg-space-950/40 flex items-center justify-between">
          <div className="flex items-center space-x-2 truncate">
            <div className="w-7 h-7 rounded-full bg-space-850 flex items-center justify-center border border-purple-500/20">
              <User className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <span className="text-xs font-medium truncate text-gray-300">
              {profile?.display_name.split(",")[0] || "Astro Explorer"}
            </span>
          </div>
          
          <button
            onClick={logout}
            className="p-1.5 rounded-md text-gray-400 hover:text-red-400 hover:bg-red-950/20 transition-all"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Workspace Tab Header */}
        <header className="h-14 bg-space-900 border-b border-purple-900/15 flex items-center justify-between px-6 shrink-0">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab("chat")}
              className={`text-xs font-semibold pb-4 pt-4 border-b-2 transition-all ${
                activeTab === "chat"
                  ? "border-purple-500 text-white"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              Consultation Chat
            </button>
            <button
              onClick={() => setActiveTab("chart")}
              className={`text-xs font-semibold pb-4 pt-4 border-b-2 transition-all ${
                activeTab === "chart"
                  ? "border-purple-500 text-white"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              Natal Placements
            </button>
            <button
              onClick={() => setActiveTab("transits")}
              className={`text-xs font-semibold pb-4 pt-4 border-b-2 transition-all ${
                activeTab === "transits"
                  ? "border-purple-500 text-white"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              Transit guidance
            </button>
          </div>

          <div className="flex items-center space-x-3 text-xs text-gray-400">
            <span className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              <span>{profile?.birth_date}</span>
            </span>
            <span className="h-3 w-px bg-purple-900/20" />
            <span className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-purple-400" />
              <span className="truncate max-w-[120px]">{profile?.birth_place.split(",")[0]}</span>
            </span>
          </div>
        </header>

        {/* Workspace Content Body */}
        <div className="flex-1 overflow-hidden p-6 relative">
          
          {/* TAB 1: CONVERSATION PANEL */}
          {activeTab === "chat" && (
            <div className="h-full flex flex-col justify-between">
              {activeSessionId ? (
                <>
                  {/* Messages Bubble Grid */}
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                    {activeMessages.map((m, idx) => (
                      <div
                        key={idx}
                        className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xl rounded-xl p-4 shadow-sm text-xs leading-relaxed ${
                            m.role === "user"
                              ? "bg-purple-600 text-white"
                              : "glass-card text-gray-300 border border-purple-500/10"
                          }`}
                        >
                          {/* Basic markdown parsing/spacing support */}
                          <div className="whitespace-pre-wrap">
                            {m.content || (
                              <div className="flex items-center space-x-2 text-gray-400">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                                <span>Aligning celestial vectors...</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input Box */}
                  <form onSubmit={handleSend} className="shrink-0 relative">
                    <input
                      type="text"
                      disabled={isStreaming}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={isStreaming ? "Awaiting stream data..." : "Ask your cosmic guide (e.g. 'What does my moon sign represent?')"}
                      className="w-full bg-space-900 border border-purple-900/30 rounded-xl py-3 pl-4 pr-12 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-transparent transition-all shadow-lg shadow-space-950"
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim() || isStreaming}
                      className="absolute inset-y-2 right-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-purple-950/40 border border-purple-500/15 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-md font-bold text-white">No Active Consultation</h3>
                    <p className="text-xs text-gray-400 max-w-xs mt-1">
                      Choose an existing stateful history from the side panel or create a new session to begin.
                    </p>
                  </div>
                  <button
                    onClick={handleCreateSession}
                    className="py-2 px-5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-md"
                  >
                    Start Consultation
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: NATAL PLACEMENTS TABLE */}
          {activeTab === "chart" && profile && (
            <div className="h-full overflow-y-auto pr-2 space-y-6">
              {/* Planetary placements grid */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center space-x-1.5">
                  <Star className="w-3.5 h-3.5 text-purple-400" />
                  <span>Natal Placements (Degrees & Signs)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(profile.natal_chart).map(([planet, details]: [string, any]) => (
                    <div
                      key={planet}
                      className="glass-card rounded-xl p-4 flex flex-col justify-between hover:border-purple-500/30 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-white text-xs">{planet}</span>
                        {details.retrograde && (
                          <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider bg-orange-950/20 border border-orange-500/15 px-1.5 py-0.5 rounded">
                            Retrograde
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Sign:</span>
                          <span className="text-white font-medium">{details.sign}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Coordinate:</span>
                          <span className="text-white font-medium">{details.degree}°</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>House Placed:</span>
                          <span className="text-white font-medium">{details.house}th House</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* House Cusps list */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center space-x-1.5">
                  <Compass className="w-3.5 h-3.5 text-purple-400 animate-spin" style={{ animationDuration: "30s" }} />
                  <span>House Cusps (Placidus Grid)</span>
                </h3>
                <div className="glass-card rounded-xl overflow-hidden border border-purple-900/15">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-space-900/60 border-b border-purple-900/15 text-gray-400">
                        <th className="py-2.5 px-4 font-semibold">House Cusp</th>
                        <th className="py-2.5 px-4 font-semibold">Zodiac Sign Alignment</th>
                        <th className="py-2.5 px-4 font-semibold">Degree Position</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-900/10">
                      {profile.houses.map((h: any) => (
                        <tr key={h.house} className="hover:bg-space-900/20">
                          <td className="py-2.5 px-4 font-semibold text-purple-300">House {h.house}</td>
                          <td className="py-2.5 px-4 text-white">{h.sign}</td>
                          <td className="py-2.5 px-4 text-gray-400">{h.degree}°</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DAILY TRANSITS */}
          {activeTab === "transits" && (
            <div className="h-full overflow-y-auto pr-2 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-purple-900/15 pb-4 mb-4 gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Active Daily Guidance</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Planetary alignments recorded at noon (12:00) today for your geocoded coordinates.
                  </p>
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-purple-300 font-semibold px-3 py-1.5 rounded-lg bg-purple-950/20 border border-purple-500/15 self-start">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Sidereal System Lahiri active</span>
                </div>
              </div>

              {isLoadingTransits ? (
                <div className="h-48 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                </div>
              ) : Object.keys(transits).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(transits).map(([planet, details]: [string, any]) => (
                    <div
                      key={planet}
                      className="glass-card rounded-xl p-4 border border-indigo-500/10 hover:border-indigo-500/35 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-white text-xs">{planet}</span>
                        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/25 px-1.5 py-0.5 rounded">
                          Transit
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Sign:</span>
                          <span className="text-white font-medium">{details.sign}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Coordinate:</span>
                          <span className="text-white font-medium">{details.degree}°</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Sign House:</span>
                          <span className="text-white font-medium">{details.house}th House</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-xs text-gray-400 italic">
                  Transit information could not be calculated. Please check backend connection.
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
};
