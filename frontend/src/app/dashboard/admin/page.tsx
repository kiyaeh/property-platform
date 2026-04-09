"use client";

import { useCallback, useEffect, useState } from 'react';
import { AuthGuard } from '../../../components/auth-guard';
import { LogoutButton } from '../../../components/logout-button';
import { ApiError, apiFetch, getAuthHeader } from '../../../lib/api';
import { AdminMetrics, PropertyListResponse } from '../../../lib/types';
import { useAuthStore } from '../../../store/auth-store';

export default function AdminDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [properties, setProperties] = useState<PropertyListResponse['data']>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAdminData = useCallback(async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [metricsResult, propertiesResult] = await Promise.all([
        apiFetch<AdminMetrics>('/admin/properties/metrics', {
          headers: getAuthHeader(token),
        }),
        apiFetch<PropertyListResponse>('/admin/properties?page=1&limit=20', {
          headers: getAuthHeader(token),
        }),
      ]);

      setMetrics(metricsResult);
      setProperties(propertiesResult.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to load admin data');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadAdminData();
  }, [loadAdminData]);

  async function disableProperty(propertyId: string) {
    if (!token) {
      return;
    }

    setError(null);
    try {
      await apiFetch(`/admin/properties/${propertyId}/disable`, {
        method: 'PATCH',
        headers: getAuthHeader(token),
      });
      await loadAdminData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to disable property');
    }
  }

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="mt-2 text-slate-600">System controls for {user?.name ?? 'Admin'}.</p>
          </div>
          <LogoutButton />
        </header>

        {isLoading ? <p className="mt-6 text-slate-600">Loading admin data...</p> : null}
        {error ? <p className="mt-6 text-red-600">{error}</p> : null}

        {metrics ? (
          <section className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            <article className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-600">Total Users</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{metrics.users.total}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-600">Owners</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{metrics.users.owners}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-600">Properties</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{metrics.properties.total}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-600">Published</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{metrics.properties.published}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-600">Draft</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{metrics.properties.draft}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-600">Archived</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{metrics.properties.archived}</p>
            </article>
          </section>
        ) : null}

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-slate-900">Property Moderation</h2>
          <div className="mt-4 space-y-3">
            {properties.map((property) => (
              <article key={property.id} className="rounded-md border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{property.title}</h3>
                    <p className="text-sm text-slate-600">
                      {property.location} • ${property.price.toLocaleString()} • {property.status}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => disableProperty(property.id)}
                    className="rounded-md border border-slate-300 px-3 py-1 text-sm text-red-700"
                  >
                    Disable
                  </button>
                </div>
              </article>
            ))}
            {!isLoading && properties.length === 0 ? (
              <p className="text-slate-600">No properties available.</p>
            ) : null}
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}
