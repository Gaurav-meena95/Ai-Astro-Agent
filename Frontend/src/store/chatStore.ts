import { create } from "zustand";
import api from "../services/api";

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatSession {
  session_id: string;
  title: string;
  created_at: string;
}

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  activeMessages: Message[];
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;

  fetchSessions: () => Promise<void>;
  createSession: () => Promise<string | null>;
  fetchMessages: (sessionId: string) => Promise<void>;
  sendMessage: (messageText: string) => Promise<void>;
  selectSession: (sessionId: string | null) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  activeMessages: [],
  isStreaming: false,
  isLoading: false,
  error: null,

  fetchSessions: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get("/api/chat/sessions");
      set({ sessions: response.data, isLoading: false });
    } catch (err: any) {
      set({ error: "Failed to load chat history.", isLoading: false });
    }
  },

  createSession: async () => {
    set({ isLoading: true });
    try {
      const response = await api.post("/api/chat/sessions");
      const { session_id } = response.data;
      
      await get().fetchSessions();
      set({ activeSessionId: session_id, activeMessages: [], isLoading: false });
      return session_id;
    } catch (err: any) {
      set({ error: "Failed to create new consultation session.", isLoading: false });
      return null;
    }
  },

  fetchMessages: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/api/chat/sessions/${sessionId}/messages`);
      set({ activeMessages: response.data, activeSessionId: sessionId, isLoading: false });
    } catch (err: any) {
      set({ error: "Failed to retrieve messages.", isLoading: false });
    }
  },

  selectSession: (sessionId) => {
    if (!sessionId) {
      set({ activeSessionId: null, activeMessages: [] });
      return;
    }
    get().fetchMessages(sessionId);
  },

  sendMessage: async (messageText) => {
    const { activeSessionId, activeMessages } = get();
    if (!activeSessionId) return;

    // 1. Immediately append human message locally
    const userMsg: Message = {
      role: "user",
      content: messageText,
      timestamp: new Date().toISOString(),
    };
    
    // Create initial empty AI response bubble
    const aiPlaceholderMsg: Message = {
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
    };

    set({
      activeMessages: [...activeMessages, userMsg, aiPlaceholderMsg],
      isStreaming: true,
      error: null,
    });

    const token = localStorage.getItem("astro_token");
    
    try {
      // 2. Query SSE Stream route using raw fetch (handles stream events natively)
      const response = await fetch("http://localhost:8000/api/chat/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: activeSessionId,
          message: messageText,
        }),
      });

      if (!response.ok) {
        throw new Error("HTTP connection failed");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("Null reader on stream");

      let accumulatedAIContent = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        // SSE formatting yields lines like "data: {...}\n\n"
        const lines = chunk.split("\n");

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;

          const rawData = trimmed.slice(5).trim();
          if (rawData === "[DONE]") {
            break;
          }

          try {
            const parsed = JSON.parse(rawData);
            if (parsed.error) {
              set({ error: parsed.error });
              break;
            }
            if (parsed.text) {
              accumulatedAIContent += parsed.text;
              
              // Dynamic state updates to render tokens as they stream in
              set((state) => {
                const updated = [...state.activeMessages];
                const lastIndex = updated.length - 1;
                if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
                  updated[lastIndex] = {
                    ...updated[lastIndex],
                    content: accumulatedAIContent,
                  };
                }
                return { activeMessages: updated };
              });
            }
          } catch (e) {
            // Partial JSON packet splits are skipped/logged defensively
          }
        }
      }

      // Finish streaming, refresh titles list to catch automatic title summaries
      await get().fetchSessions();
      set({ isStreaming: false });

    } catch (err: any) {
      set((state) => {
        const updated = [...state.activeMessages];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
          updated[lastIndex] = {
            ...updated[lastIndex],
            content: "We encountered an issue generating your response. Please try sending again.",
          };
        }
        return {
          activeMessages: updated,
          isStreaming: false,
          error: "Connection lost while streaming.",
        };
      });
    }
  },
}));
