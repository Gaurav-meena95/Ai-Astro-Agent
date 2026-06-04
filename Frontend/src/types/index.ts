export interface User {
  username: string;
  email: string;
  access_token: string;
}

export interface Message {
  role: "human" | "ai";
  content: string;
}

export interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at?: string;
}

export interface Profile {
  birth_date: string;
  birth_time: string;
  birth_place: string;
  ascendant: string;
  placements: Record<string, { sign: string; degree: number; house: number }>;
  houses: Record<string, { sign: string; degree: number }>;
}
