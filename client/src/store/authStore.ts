import { create } from 'zustand';

export interface User {
  _id: string;
  name: string;
  email?: string;
  role: 'admin' | 'manager' | 'employee';
  department?: string | { _id: string; name: string; code: string };
  xp: number;
  points: number;
  completedChallengeCount?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  updateUserStats: (xp: number, points: number) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Load initial state from localStorage
  const savedUser = localStorage.getItem('ecosphere_user');
  const savedToken = localStorage.getItem('ecosphere_token');

  return {
    user: savedUser ? JSON.parse(savedUser) : null,
    token: savedToken || null,
    setAuth: (user, token) => {
      localStorage.setItem('ecosphere_user', JSON.stringify(user));
      localStorage.setItem('ecosphere_token', token);
      set({ user, token });
    },
    updateUserStats: (xp, points) => {
      set((state) => {
        if (!state.user) return {};
        const updatedUser = { ...state.user, xp, points };
        localStorage.setItem('ecosphere_user', JSON.stringify(updatedUser));
        return { user: updatedUser };
      });
    },
    logout: () => {
      localStorage.removeItem('ecosphere_user');
      localStorage.removeItem('ecosphere_token');
      set({ user: null, token: null });
    },
  };
});
