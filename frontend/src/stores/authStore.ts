import { create } from 'zustand';

export interface AuthUserState {
  token?: string;
  userId?: string;
  username?: string;
  realName?: string;
  role?: string;
  setAuth: (payload: { token: string; userId: string; username: string; realName?: string; role: string }) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

const stored = (() => {
  try {
    return JSON.parse(localStorage.getItem('gis-auth') || '{}');
  } catch {
    return {};
  }
})();

export const useAuthStore = create<AuthUserState>((set, get) => ({
  token: stored.token,
  userId: stored.userId,
  username: stored.username,
  realName: stored.realName,
  role: stored.role,
  setAuth: (payload) => {
    localStorage.setItem('gis-auth', JSON.stringify(payload));
    set(payload);
  },
  clearAuth: () => {
    localStorage.removeItem('gis-auth');
    set({ token: undefined, userId: undefined, username: undefined, realName: undefined, role: undefined });
  },
  isAuthenticated: () => Boolean(get().token)
}));