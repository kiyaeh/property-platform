"use client";

import { useEffect } from 'react';
import { apiFetch, getAuthHeader } from '../lib/api';
import { AuthUser } from '../lib/types';
import { useAuthStore } from '../store/auth-store';

export function AuthSessionBootstrap() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

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

  return null;
}
