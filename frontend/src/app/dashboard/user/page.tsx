"use client";

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthGuard } from '../../../components/auth-guard';
import { FeedbackToast } from '../../../components/feedback-toast';
import { LogoutButton } from '../../../components/logout-button';
import { ApiError, apiFetch, getAuthHeader } from '../../../lib/api';
import { FavoriteWithPropertyRecord, PropertyListResponse } from '../../../lib/types';
import { useAuthStore } from '../../../store/auth-store';

export default function UserDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const [favorites, setFavorites] = useState<FavoriteWithPropertyRecord[]>([]);
  const [publishedTotal, setPublishedTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMutatingId, setIsMutatingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const loadDashboardData = useCallback(async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [favoritesResult, propertiesResult] = await Promise.all([
        apiFetch<FavoriteWithPropertyRecord[]>('/users/favorites', {
          headers: getAuthHeader(token),
        }),
        apiFetch<PropertyListResponse>('/properties?page=1&limit=1'),
      ]);

      setFavorites(favoritesResult);
      setPublishedTotal(propertiesResult.meta.total);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to load user dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  async function removeFavorite(propertyId: string) {
    if (!token) {
      return;
    }

    setIsMutatingId(propertyId);
    setError(null);
    try {
      await apiFetch<{ success: boolean }>(`/users/favorites/${propertyId}`, {
        method: 'DELETE',
        headers: getAuthHeader(token),
      });
      setFavorites((current) =>
        current.filter((favorite) => favorite.propertyId !== propertyId),
      );
      setSuccessMessage('Favorite removed successfully.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to remove favorite');
    } finally {
      setIsMutatingId(null);
    }
  }

  const dashboardCards = useMemo(
    () => [
      { label: 'Saved Favorites', value: favorites.length },
      { label: 'Published Properties', value: publishedTotal },
    ],
    [favorites.length, publishedTotal],
  );

  return (
    <AuthGuard allowedRoles={['USER']}>
      <main className="page-shell max-w-5xl">
        <FeedbackToast
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />

        <header className="dashboard-hero flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-950">User Dashboard</h1>
            <p className="mt-2 text-blue-700">Welcome back, {user?.name ?? 'User'}.</p>
            {lastUpdated ? (
              <p className="mt-1 text-xs font-medium text-blue-600">Last synced: {lastUpdated}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadDashboardData()}
              className="btn-secondary px-3 py-2 text-sm"
            >
              Refresh
            </button>
            <LogoutButton />
          </div>
        </header>

        <section className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {dashboardCards.map((card) => (
            <article key={card.label} className="metric-tile p-5">
              <p className="text-sm text-blue-700">{card.label}</p>
              <p className="mt-1 text-3xl font-bold text-blue-950">{card.value}</p>
            </article>
          ))}
        </section>

        <section className="panel mt-8 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-blue-950">Saved Favorites</h2>
              <p className="mt-1 text-sm text-blue-700">
                Manage properties you saved and jump directly to their detail pages.
              </p>
            </div>
            <Link href="/properties" className="btn-primary px-4 py-2 text-sm">
              Browse Properties
            </Link>
          </div>

          {isLoading ? <p className="mt-4 text-blue-700">Loading your favorites...</p> : null}
          {error ? <p className="mt-4 text-red-600">{error}</p> : null}

          <div className="mt-4 space-y-3">
            {favorites.map((favorite) => (
              <article key={favorite.id} className="rounded-lg border border-blue-100 bg-blue-50/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-blue-950">{favorite.property.title}</h3>
                    <p className="text-sm text-blue-700">
                      {favorite.property.location} • ${favorite.property.price.toLocaleString()}
                    </p>
                    <span className="status-chip published mt-2">PUBLISHED</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/properties/${favorite.property.id}`}
                      className="btn-secondary px-3 py-1 text-sm"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeFavorite(favorite.propertyId)}
                      disabled={isMutatingId === favorite.propertyId}
                      className="btn-secondary px-3 py-1 text-sm text-red-700 disabled:opacity-60"
                    >
                      {isMutatingId === favorite.propertyId ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </div>
              </article>
            ))}

            {!isLoading && favorites.length === 0 ? (
              <p className="text-blue-700">
                You have no favorites yet. Explore listings and save the ones you like.
              </p>
            ) : null}
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}
