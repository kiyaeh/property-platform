"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AuthGuard } from '../../../components/auth-guard';
import { LogoutButton } from '../../../components/logout-button';
import { ApiError, apiFetch, getAuthHeader } from '../../../lib/api';
import { PropertyListResponse } from '../../../lib/types';
import { useAuthStore } from '../../../store/auth-store';

type ImageInput = {
  url: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  size: number;
};

const emptyImage = (): ImageInput => ({
  url: '',
  mimeType: 'image/jpeg',
  size: 100000,
});

export default function OwnerDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState<number>(1000);
  const [images, setImages] = useState<ImageInput[]>([emptyImage(), emptyImage()]);

  const [items, setItems] = useState<PropertyListResponse['data']>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const queryStatus = useMemo(
    () => (statusFilter === 'ALL' ? '' : `?status=${statusFilter}`),
    [statusFilter],
  );

  const loadProperties = useCallback(async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await apiFetch<PropertyListResponse>(
        `/owner/properties${queryStatus}`,
        {
          headers: getAuthHeader(token),
        },
      );
      setItems(response.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to load properties');
    } finally {
      setIsLoading(false);
    }
  }, [token, queryStatus]);

  useEffect(() => {
    void loadProperties();
  }, [loadProperties]);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      return;
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      await apiFetch('/owner/properties', {
        method: 'POST',
        headers: getAuthHeader(token),
        body: JSON.stringify({ title, description, location, price, images }),
      });
      setTitle('');
      setDescription('');
      setLocation('');
      setPrice(1000);
      setImages([emptyImage(), emptyImage()]);
      await loadProperties();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Unable to create property');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function publishProperty(propertyId: string) {
    if (!token) {
      return;
    }

    setActionError(null);
    try {
      await apiFetch(`/owner/properties/${propertyId}/publish`, {
        method: 'POST',
        headers: getAuthHeader(token),
      });
      await loadProperties();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Unable to publish property');
    }
  }

  async function deleteProperty(propertyId: string) {
    if (!token) {
      return;
    }

    setActionError(null);
    try {
      await apiFetch<{ success: boolean }>(`/owner/properties/${propertyId}`, {
        method: 'DELETE',
        headers: getAuthHeader(token),
      });
      await loadProperties();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Unable to delete property');
    }
  }

  function updateImage(index: number, next: Partial<ImageInput>) {
    setImages((current) =>
      current.map((image, i) => (i === index ? { ...image, ...next } : image)),
    );
  }

  function addImageRow() {
    if (images.length >= 10) {
      return;
    }
    setImages((current) => [...current, emptyImage()]);
  }

  function removeImageRow(index: number) {
    if (images.length <= 2) {
      return;
    }
    setImages((current) => current.filter((_, i) => i !== index));
  }

  return (
    <AuthGuard allowedRoles={['OWNER']}>
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Owner Dashboard</h1>
            <p className="mt-2 text-slate-600">Manage your listings, {user?.name ?? 'Owner'}.</p>
          </div>
          <LogoutButton />
        </header>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-slate-900">Create Property</h2>
          <form onSubmit={onCreate} className="mt-4 space-y-3">
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <textarea
              className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              type="number"
              min={1}
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              required
            />

            <div className="space-y-3 rounded-md border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Images (min 2)</h3>
                <button
                  type="button"
                  onClick={addImageRow}
                  className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                >
                  Add image
                </button>
              </div>

              {images.map((image, index) => (
                <div key={index} className="grid gap-2 rounded-md border border-slate-200 p-3 sm:grid-cols-4">
                  <input
                    className="rounded-md border border-slate-300 px-2 py-1 sm:col-span-2"
                    placeholder="Image URL"
                    value={image.url}
                    onChange={(e) => updateImage(index, { url: e.target.value })}
                    required
                  />
                  <select
                    className="rounded-md border border-slate-300 px-2 py-1"
                    value={image.mimeType}
                    onChange={(e) =>
                      updateImage(index, {
                        mimeType: e.target.value as ImageInput['mimeType'],
                      })
                    }
                  >
                    <option value="image/jpeg">image/jpeg</option>
                    <option value="image/png">image/png</option>
                    <option value="image/webp">image/webp</option>
                  </select>
                  <div className="flex gap-2">
                    <input
                      className="w-full rounded-md border border-slate-300 px-2 py-1"
                      type="number"
                      min={1}
                      max={5000000}
                      value={image.size}
                      onChange={(e) => updateImage(index, { size: Number(e.target.value) })}
                    />
                    <button
                      type="button"
                      onClick={() => removeImageRow(index)}
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-slate-900 px-4 py-2 font-semibold text-white disabled:opacity-60"
            >
              {isSubmitting ? 'Creating...' : 'Create draft'}
            </button>
          </form>
        </section>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-900">My Properties</h2>
            <select
              className="rounded-md border border-slate-300 px-3 py-2"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as 'ALL' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
                )
              }
            >
              <option value="ALL">All</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          {isLoading ? <p className="mt-4 text-slate-600">Loading properties...</p> : null}
          {error ? <p className="mt-4 text-red-600">{error}</p> : null}

          <div className="mt-4 space-y-3">
            {items.map((property) => (
              <article key={property.id} className="rounded-md border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">{property.title}</h3>
                    <p className="text-sm text-slate-600">
                      {property.location} • ${property.price.toLocaleString()} • {property.status}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {property.status === 'DRAFT' ? (
                      <button
                        type="button"
                        onClick={() => publishProperty(property.id)}
                        className="rounded-md border border-slate-300 px-3 py-1 text-sm"
                      >
                        Publish
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => deleteProperty(property.id)}
                      className="rounded-md border border-slate-300 px-3 py-1 text-sm text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
            {!isLoading && items.length === 0 ? (
              <p className="text-slate-600">No properties found for this filter.</p>
            ) : null}
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}
