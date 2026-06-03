import { create } from "zustand";
import api from "../services/api";

export interface NatalPlacement {
  planet: string;
  sign: string;
  degree: number;
  house: number;
  retrograde: boolean;
}

export interface HouseCusp {
  house: number;
  sign: string;
  degree: number;
}

export interface UserProfile {
  birth_date: string;
  birth_time: string;
  birth_place: string;
  display_name: string;
  latitude: number;
  longitude: number;
  timezone_id: string;
  natal_chart: Record<string, NatalPlacement>;
  houses: HouseCusp[];
}

interface AuthState {
  token: string | null;
  email: string | null;
  userId: string | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  fetchProfile: () => Promise<boolean>;
  createProfile: (birthDate: string, birthTime: string, birthPlace: string) => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem("astro_token"),
  email: localStorage.getItem("astro_email"),
  userId: localStorage.getItem("astro_user_id"),
  profile: null,
  isAuthenticated: !!localStorage.getItem("astro_token"),
  isOnboarded: false,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post("/api/auth/login", { email, password });
      const { token, email: resEmail, user_id } = response.data;
      
      localStorage.setItem("astro_token", token);
      localStorage.setItem("astro_email", resEmail);
      localStorage.setItem("astro_user_id", user_id);
      
      set({
        token,
        email: resEmail,
        userId: user_id,
        isAuthenticated: true,
        isLoading: false,
      });
      
      // Auto-fetch profile after login
      await get().fetchProfile();
      return true;
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || "Authentication login failed.";
      set({ error: errMsg, isLoading: false });
      return false;
    }
  },

  signup: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post("/api/auth/signup", { email, password });
      const { token, email: resEmail, user_id } = response.data;
      
      localStorage.setItem("astro_token", token);
      localStorage.setItem("astro_email", resEmail);
      localStorage.setItem("astro_user_id", user_id);
      
      set({
        token,
        email: resEmail,
        userId: user_id,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || "Registration signup failed.";
      set({ error: errMsg, isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem("astro_token");
    localStorage.removeItem("astro_email");
    localStorage.removeItem("astro_user_id");
    set({
      token: null,
      email: null,
      userId: null,
      profile: null,
      isAuthenticated: false,
      isOnboarded: false,
      error: null,
    });
  },

  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get("/api/profile");
      set({
        profile: response.data,
        isOnboarded: true,
        isLoading: false,
        error: null
      });
      return true;
    } catch (err: any) {
      // 404 is normal if user hasn't onboarded yet
      set({ 
        profile: null, 
        isOnboarded: false, 
        isLoading: false 
      });
      return false;
    }
  },

  createProfile: async (birthDate, birthTime, birthPlace) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post("/api/profile/birth-chart", {
        birth_date: birthDate,
        birth_time: birthTime,
        birth_place: birthPlace,
      });
      
      set({
        profile: response.data.profile,
        isOnboarded: true,
        isLoading: false,
      });
      return true;
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || "Failed to calculate birth chart.";
      set({ error: errMsg, isLoading: false });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
