"use client";

import { useEffect } from 'react';
import { useFavoritesStore } from '../store/favorites-store';

const STORAGE_KEY = 'property-platform-favorites';

export function FavoritesSync() {
  const setIds = useFavoritesStore((state) => state.setIds);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY || !event.newValue) {
        return;
      }

      try {
        const parsed = JSON.parse(event.newValue) as { state?: { ids?: unknown } };
        const ids = parsed.state?.ids;
        if (Array.isArray(ids) && ids.every((id) => typeof id === 'string')) {
          setIds(ids);
        }
      } catch {
        // Ignore malformed storage payload.
      }
    }

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [setIds]);

  return null;
}
