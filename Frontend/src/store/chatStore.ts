import { create } from "zustand";
import axios from "axios";
import type { Message, Session } from "../types/index";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface ChatState {
  sessions: Session[];
  currentSession: Session | null;
  messages: Message[];
  isStreaming: boolean;
  activeNode: string | null;
  fetchSessions: (token: string) => Promise<void>;
  loadSession: (sessionId: string, token: string) => Promise<void>;
  sendMessage: (message: string, token: string, sessionId?: string) => Promise<void>;
  newChat: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  currentSession: null,
  messages: [],
  isStreaming: false,
  activeNode: null,

  fetchSessions: async (token) => {
    try {
      const res = await axios.get(`${API}/api/chat/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ sessions: res.data });
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    }
  },

  loadSession: async (sessionId, token) => {
    try {
      const res = await axios.get(`${API}/api/chat/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dbMessages = res.data.messages || [];
      const messages = dbMessages.map((m: any) => ({
        role: m.role === "human" ? "human" : "ai",
        content: m.content
      }));
      set({
        currentSession: {
          id: res.data._id,
          title: res.data.title,
          created_at: res.data.created_at,
          updated_at: res.data.updated_at
        },
        messages
      });
    } catch (err) {
      console.error("Failed to load session:", err);
    }
  },

  sendMessage: async (message, token, sessionId) => {
    // 1. Add empty human message to messages
    set(state => ({
      messages: [...state.messages, { role: "human", content: message }],
      isStreaming: true,
      activeNode: null
    }));

    try {
      const response = await fetch(`${API}/api/chat/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ message, session_id: sessionId })
      });

      if (!response.ok) {
        throw new Error(`SSE request failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("Null reader on stream");

      // Add empty AI message to start streaming into
      set(state => ({
        messages: [...state.messages, { role: "ai", content: "" }]
      }));

      let accumulatedText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                accumulatedText += data.text;
                // Append text to last AI message
                set(state => {
                  const messages = [...state.messages];
                  if (messages.length > 0 && messages[messages.length - 1].role === "ai") {
                    messages[messages.length - 1] = {
                      ...messages[messages.length - 1],
                      content: accumulatedText
                    };
                  }
                  return { messages };
                });
              }
              if (data.node) {
                set({ activeNode: data.node });
              }
              if (data.session_id) {
                set({
                  currentSession: {
                    id: data.session_id,
                    title: message.slice(0, 50),
                    created_at: new Date().toISOString()
                  }
                });
              }
              if (data.done) {
                set({ isStreaming: false, activeNode: null });
              }
            } catch (e) {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }
      }

      // Refresh sessions
      await get().fetchSessions(token);
      set({ isStreaming: false, activeNode: null });
    } catch (err) {
      set({ isStreaming: false, activeNode: null });
      throw err;
    }
  },

  newChat: () => {
    set({
      currentSession: null,
      messages: []
    });
  }
}));
