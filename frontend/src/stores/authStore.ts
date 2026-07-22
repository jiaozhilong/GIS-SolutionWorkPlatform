import { create } from 'zustand';

export type RuntimeMode = 'REAL' | 'PREVIEW';

export interface AuthSessionPayload {
  token: string;
  userId: string;
  username: string;
  realName?: string;
  role: string;
}

export interface PreviewSessionPayload {
  userId: string;
  username: string;
  realName?: string;
  role: string;
}

export interface AuthUserState {
  runtimeMode: RuntimeMode;
  token?: string;
  userId?: string;
  username?: string;
  realName?: string;
  role?: string;
  setAuth: (payload: AuthSessionPayload) => void;
  setPreviewAuth: (payload: PreviewSessionPayload) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

interface StoredAuthState extends Partial<AuthSessionPayload>, Partial<PreviewSessionPayload> {
  runtimeMode?: RuntimeMode;
}

function readStoredAuth(): StoredAuthState {
  try {
    const stored = JSON.parse(localStorage.getItem('gis-auth') || '{}') as StoredAuthState;
    if (stored.token === 'local-preview-token') {
      return {
        runtimeMode: 'PREVIEW',
        userId: stored.userId || 'local-preview-user',
        username: stored.username || 'admin',
        realName: stored.realName || '本地预览',
        role: stored.role || 'ADMIN'
      };
    }
    return stored;
  } catch {
    return {};
  }
}

function persistAuth(payload: StoredAuthState) {
  localStorage.setItem('gis-auth', JSON.stringify(payload));
}

const stored = readStoredAuth();

export const useAuthStore = create<AuthUserState>((set, get) => ({
  runtimeMode: stored.runtimeMode || 'REAL',
  token: stored.runtimeMode === 'PREVIEW' ? undefined : stored.token,
  userId: stored.userId,
  username: stored.username,
  realName: stored.realName,
  role: stored.role,
  setAuth: (payload) => {
    const session = { ...payload, runtimeMode: 'REAL' as const };
    persistAuth(session);
    set(session);
  },
  setPreviewAuth: (payload) => {
    const session = { ...payload, runtimeMode: 'PREVIEW' as const };
    persistAuth(session);
    set({ ...session, token: undefined });
  },
  clearAuth: () => {
    localStorage.removeItem('gis-auth');
    set({
      runtimeMode: 'REAL',
      token: undefined,
      userId: undefined,
      username: undefined,
      realName: undefined,
      role: undefined
    });
  },
  isAuthenticated: () => get().runtimeMode === 'PREVIEW' || Boolean(get().token)
}));
