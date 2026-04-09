"use client";

import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth-store';
import { useFavoritesStore } from '../store/favorites-store';

export function LogoutButton() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const clearFavorites = useFavoritesStore((state) => state.clear);

  return (
    <button
      type="button"
      onClick={() => {
        logout();
        clearFavorites();
        router.replace('/login');
      }}
      className="btn-secondary px-3 py-2 text-sm"
    >
      Logout
    </button>
  );
}
