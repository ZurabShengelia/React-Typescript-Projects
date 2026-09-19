import { create } from "zustand";
import { api, getErrorMessage } from "@/lib/api";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  error: string | null;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;

  register: (name: string, email: string, password: string) => Promise<string>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerificationCode: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "idle",
  error: null,

  hydrate: async () => {
    set({ status: "loading" });
    try {
      const res = await api.get("/auth/me");
      set({ user: res.data.data.user, status: "authenticated" });
    } catch {
      set({ user: null, status: "unauthenticated" });
    }
  },

  login: async (email, password) => {
    set({ error: null });
    try {
      const res = await api.post("/auth/login", { email, password });
      set({ user: res.data.data.user, status: "authenticated" });
    } catch (err) {

      const isUnverified = (err as any)?.response?.data?.message === "EMAIL_NOT_VERIFIED";
      const message = isUnverified ? "EMAIL_NOT_VERIFIED" : getErrorMessage(err);
      if (!isUnverified) set({ error: message });
      throw new Error(message);
    }
  },

  register: async (name, email, password) => {
    set({ error: null });
    try {
      const res = await api.post("/auth/register", { name, email, password });
      return res.data.data.email as string;
    } catch (err) {
      const message = getErrorMessage(err);
      set({ error: message });
      throw new Error(message);
    }
  },

  verifyEmail: async (email, code) => {
    set({ error: null });
    try {
      const res = await api.post("/auth/verify-email", { email, code });
      set({ user: res.data.data.user, status: "authenticated" });
    } catch (err) {
      const message = getErrorMessage(err);
      set({ error: message });
      throw new Error(message);
    }
  },

  resendVerificationCode: async (email) => {
    await api.post("/auth/resend-verification-code", { email });
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      set({ user: null, status: "unauthenticated" });
    }
  },

  clearError: () => set({ error: null }),
}));
