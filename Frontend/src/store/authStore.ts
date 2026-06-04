import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

const API = "http://localhost:8000";

interface AuthState {
  token: string | null;
  username: string | null;
  profile: any | null;
  isOnboarded: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  setProfile: (profile: any) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      username: null,
      profile: null,
      isOnboarded: false,

      login: async (email, password) => {
        const response = await axios.post(`${API}/api/auth/login`, { email, password });
        const { access_token, username } = response.data;
        set({ token: access_token, username });
        await get().fetchProfile();
      },

      signup: async (username, email, password) => {
        const response = await axios.post(`${API}/api/auth/signup`, { username, email, password });
        const { access_token, username: resUsername } = response.data;
        set({ token: access_token, username: resUsername, isOnboarded: false });
      },

      logout: () => {
        set({ token: null, username: null, profile: null, isOnboarded: false });
      },

      fetchProfile: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const response = await axios.get(`${API}/api/profile`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          const profile = response.data.profile;
          if (profile) {
            set({ profile, isOnboarded: true });
          } else {
            set({ profile: null, isOnboarded: false });
          }
        } catch (error) {
          set({ profile: null, isOnboarded: false });
          throw error;
        }
      },

      setProfile: (profile: any) => {
        set({ profile, isOnboarded: true });
      }
    }),
    {
      name: "astro-auth-store",
      partialize: (state) => ({
        token: state.token,
        username: state.username
      })
    }
  )
);
