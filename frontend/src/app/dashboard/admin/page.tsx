"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthGuard } from '../../../components/auth-guard';
import { FeedbackToast } from '../../../components/feedback-toast';
import { LogoutButton } from '../../../components/logout-button';
import { ApiError, apiFetch, getAuthHeader } from '../../../lib/api';
import { AdminMetrics, PropertyListResponse } from '../../../lib/types';
import { useAuthStore } from '../../../store/auth-store';

function getStatusChipClass(status: string) {
  if (status === 'PUBLISHED') return 'status-chip published';
  if (status === 'ARCHIVED') return 'status-chip archived';
  return 'status-chip draft';
}

export default function AdminDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [properties, setProperties] = useState<PropertyListResponse['data']>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('ALL');
  const [locationFilter, setLocationFilter] = useState('');
  const [titleFilter, setTitleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutatingId, setIsMutatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const queryStatus = useMemo(
    () => (statusFilter === 'ALL' ? '' : `&status=${statusFilter}`),
    [statusFilter],
  );
  const queryLocation = useMemo(
    () => (locationFilter.trim() ? `&location=${encodeURIComponent(locationFilter.trim())}` : ''),
    [locationFilter],
  );

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
        apiFetch<PropertyListResponse>(
          `/admin/properties?page=${page}&limit=12${queryStatus}${queryLocation}`,
          {
          headers: getAuthHeader(token),
          },
        ),
      ]);

      setMetrics(metricsResult);
      setProperties(propertiesResult.data);
      setTotalPages(Math.max(propertiesResult.meta.totalPages, 1));
      setTotalItems(propertiesResult.meta.total);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to load admin data');
    } finally {
      setIsLoading(false);
    }
  }, [token, page, queryStatus, queryLocation]);

  useEffect(() => {
    void loadAdminData();
  }, [loadAdminData]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, locationFilter]);

  async function disableProperty(propertyId: string) {
    if (!token) {
      return;
    }

    const approved = window.confirm(
      'Are you sure you want to disable this property? This will archive it immediately.',
    );
    if (!approved) {
      return;
    }

    setError(null);
    setIsMutatingId(propertyId);
    try {
      await apiFetch(`/admin/properties/${propertyId}/disable`, {
        method: 'PATCH',
        headers: getAuthHeader(token),
      });
      await loadAdminData();
      setSuccessMessage('Property disabled successfully.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to disable property');
    } finally {
      setIsMutatingId(null);
    }
  }

  const filteredProperties = useMemo(() => {
    if (!titleFilter.trim()) {
      return properties;
    }

    const query = titleFilter.trim().toLowerCase();
    return properties.filter((property) =>
      `${property.title} ${property.location}`.toLowerCase().includes(query),
    );
  }, [properties, titleFilter]);

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <main className="page-shell max-w-5xl">
        <FeedbackToast
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />

        <header className="dashboard-hero flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-950">Admin Dashboard</h1>
            <p className="mt-2 text-blue-700">System controls for {user?.name ?? 'Admin'}.</p>
            {lastUpdated ? (
              <p className="mt-1 text-xs font-medium text-blue-600">Last synced: {lastUpdated}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadAdminData()}
              className="btn-secondary px-3 py-2 text-sm"
            >
              Refresh
            </button>
            <LogoutButton />
          </div>
        </header>

        {isLoading ? <p className="mt-6 text-blue-700">Loading admin data...</p> : null}
        {error ? <p className="mt-6 text-red-600">{error}</p> : null}

        {metrics ? (
          <section className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            <article className="metric-tile p-4">
              <p className="text-sm text-blue-700">Total Users</p>
              <p className="mt-1 text-2xl font-bold text-blue-950">{metrics.users.total}</p>
            </article>
            <article className="metric-tile p-4">
              <p className="text-sm text-blue-700">Owners</p>
              <p className="mt-1 text-2xl font-bold text-blue-950">{metrics.users.owners}</p>
            </article>
            <article className="metric-tile p-4">
              <p className="text-sm text-blue-700">Properties</p>
              <p className="mt-1 text-2xl font-bold text-blue-950">{metrics.properties.total}</p>
            </article>
            <article className="metric-tile p-4">
              <p className="text-sm text-blue-700">Published</p>
              <p className="mt-1 text-2xl font-bold text-blue-950">{metrics.properties.published}</p>
            </article>
            <article className="metric-tile p-4">
              <p className="text-sm text-blue-700">Draft</p>
              <p className="mt-1 text-2xl font-bold text-blue-950">{metrics.properties.draft}</p>
            </article>
            <article className="metric-tile p-4">
              <p className="text-sm text-blue-700">Archived</p>
              <p className="mt-1 text-2xl font-bold text-blue-950">{metrics.properties.archived}</p>
            </article>
          </section>
        ) : null}

        <section className="panel mt-8 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-blue-950">Property Moderation</h2>
              <p className="mt-1 text-sm text-blue-700">Review listing quality and archive policy violations.</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="field"
              placeholder="Search by location"
            />
            <input
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
              className="field"
              placeholder="Search by title (current page)"
            />
            <select
              className="field"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as 'ALL' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
                )
              }
            >
              <option value="ALL">All status</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-blue-700">
            <p>
              Showing {filteredProperties.length} on page {page} of {totalPages} • Total records: {totalItems}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                disabled={page <= 1 || isLoading}
                className="btn-secondary px-3 py-1 text-sm disabled:opacity-60"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                disabled={page >= totalPages || isLoading}
                className="btn-secondary px-3 py-1 text-sm disabled:opacity-60"
              >
                Next
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {filteredProperties.map((property) => (
              <article key={property.id} className="rounded-lg border border-blue-100 bg-blue-50/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-blue-950">{property.title}</h3>
                    <p className="text-sm text-blue-700">
                      {property.location} • ${property.price.toLocaleString()}
                    </p>
                    <span className={`${getStatusChipClass(property.status)} mt-2`}>{property.status}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => disableProperty(property.id)}
                    disabled={isMutatingId === property.id || property.status === 'ARCHIVED'}
                    className="btn-secondary px-3 py-1 text-sm text-red-700 disabled:opacity-60"
                  >
                    {isMutatingId === property.id ? 'Disabling...' : 'Disable'}
                  </button>
                </div>
              </article>
            ))}
            {!isLoading && filteredProperties.length === 0 ? (
              <p className="text-blue-700">No properties available.</p>
            ) : null}
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}
