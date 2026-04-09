"use client";

import { useMemo, useState } from 'react';
import { apiFetch, getAuthHeader, ApiError } from '../lib/api';
import { useAuthStore } from '../store/auth-store';
import { useFavoritesStore } from '../store/favorites-store';

type FavoriteButtonProps = {
  propertyId: string;
};

export function FavoriteButton({ propertyId }: FavoriteButtonProps) {
  const token = useAuthStore((state) => state.token);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  const favoritesHydrated = useFavoritesStore((state) => state.isHydrated);
  const ids = useFavoritesStore((state) => state.ids);
  const add = useFavoritesStore((state) => state.add);
  const remove = useFavoritesStore((state) => state.remove);

  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const isFavorite = useMemo(() => ids.includes(propertyId), [ids, propertyId]);

  async function toggleFavorite() {
    if (!token) {
      setError('Login required to save favorites');
      return;
    }

    setError(null);
    setIsPending(true);

    const optimisticFavorite = !isFavorite;
    if (optimisticFavorite) {
      add(propertyId);
    } else {
      remove(propertyId);
    }

    try {
      await apiFetch<{ success?: boolean }>(`/users/favorites/${propertyId}`, {
        method: optimisticFavorite ? 'POST' : 'DELETE',
        headers: getAuthHeader(token),
      });
    } catch (err) {
      if (optimisticFavorite) {
        remove(propertyId);
      } else {
        add(propertyId);
      }
      setError(err instanceof ApiError ? err.message : 'Unable to update favorite');
    } finally {
      setIsPending(false);
    }
  }

  if (!isHydrated || !favoritesHydrated) {
    return <span className="text-xs text-slate-500">Loading...</span>;
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={toggleFavorite}
        disabled={isPending}
        className="rounded-md border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {isPending ? 'Saving...' : isFavorite ? 'Saved' : 'Save'}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
