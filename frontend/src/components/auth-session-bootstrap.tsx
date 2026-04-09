"use client";

import { useEffect } from 'react';
import { apiFetch, getAuthHeader } from '../lib/api';
import { AuthUser, FavoriteRecord } from '../lib/types';
import { useAuthStore } from '../store/auth-store';
import { useFavoritesStore } from '../store/favorites-store';

export function AuthSessionBootstrap() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const setFavoriteIds = useFavoritesStore((state) => state.setIds);

  useEffect(() => {
    if (!token || user) {
      return;
    }

    apiFetch<AuthUser>('/auth/me', {
      headers: getAuthHeader(token),
    })
      .then((me) => setUser(me))
      .catch(() => logout());
  }, [token, user, setUser, logout]);

  useEffect(() => {
    if (!token) {
      setFavoriteIds([]);
      return;
    }

    apiFetch<FavoriteRecord[]>('/users/favorites', {
      headers: getAuthHeader(token),
    })
      .then((favorites) => setFavoriteIds(favorites.map((item) => item.propertyId)))
      .catch(() => {
        setFavoriteIds([]);
      });
  }, [token, setFavoriteIds]);

  return null;
}
