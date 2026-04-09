import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { AuthResponse, AuthUser, Role } from '../lib/types';

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  isHydrated: boolean;
  setSession: (session: AuthResponse) => void;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
  markHydrated: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isHydrated: false,
      setSession: (session) =>
        set({
          token: session.accessToken,
          user: session.user,
        }),
      setUser: (user) => set({ user }),
      logout: () =>
        set({
          token: null,
          user: null,
        }),
      markHydrated: (value) => set({ isHydrated: value }),
    }),
    {
      name: 'property-platform-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated(true);
      },
    },
  ),
);

export function hasRequiredRole(userRole: Role | undefined, allowedRoles: Role[]) {
  if (!userRole) {
    return false;
  }

  return allowedRoles.includes(userRole);
}
