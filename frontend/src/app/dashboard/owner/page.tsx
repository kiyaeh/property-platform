"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AuthGuard } from '../../../components/auth-guard';
import { FeedbackToast } from '../../../components/feedback-toast';
import { LogoutButton } from '../../../components/logout-button';
import { ApiError, apiFetch, getAuthHeader } from '../../../lib/api';
import { PropertyListResponse, PropertyRecord } from '../../../lib/types';
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

function normalizeImageUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return trimmed;
  }

  // Handle common copy/paste wrappers from docs/chats.
  const unwrapped = trimmed
    .replace(/^['"<\(\[]+/, '')
    .replace(/[\]\)>,'".]+$/, '');

  if (unwrapped.startsWith('//')) {
    return `https:${unwrapped}`;
  }

  if (!/^https?:\/\//i.test(unwrapped)) {
    return `https://${unwrapped}`;
  }

  return unwrapped;
}

function getValidHttpUrl(value: string): string | null {
  const candidates = [value, encodeURI(value)];

  for (const candidate of candidates) {
    try {
      const parsed = new URL(candidate);
      if (['http:', 'https:'].includes(parsed.protocol)) {
        return parsed.toString();
      }
    } catch {
      // Try next candidate.
    }
  }

  return null;
}

function validateAndNormalizeImages(images: ImageInput[]): {
  valid: boolean;
  normalized: ImageInput[];
  message?: string;
} {
  const normalized: ImageInput[] = images.map((image) => ({
    ...image,
    url: normalizeImageUrl(image.url),
  }));

  for (let index = 0; index < normalized.length; index += 1) {
    const item = normalized[index];
    if (!item.url) {
      return {
        valid: false,
        normalized,
        message: `Image ${index + 1} URL is required.`,
      };
    }

    const validUrl = getValidHttpUrl(item.url);
    if (!validUrl) {
      return {
        valid: false,
        normalized,
        message:
          `Image ${index + 1} URL is invalid. Use a direct image link like ` +
          `https://example.com/photo.jpg`,
      };
    }

    normalized[index] = {
      ...item,
      url: validUrl,
    };
  }

  return { valid: true, normalized };
}

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
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isPublishingId, setIsPublishingId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editPrice, setEditPrice] = useState<number>(1000);
  const [editImages, setEditImages] = useState<ImageInput[]>([emptyImage(), emptyImage()]);
  const [initialEditSnapshot, setInitialEditSnapshot] = useState<string>('');

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
      setLastUpdated(new Date().toLocaleTimeString());
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

    const normalizedResult = validateAndNormalizeImages(images);
    setImages(normalizedResult.normalized);
    if (!normalizedResult.valid) {
      setActionError(normalizedResult.message ?? 'Invalid image URLs.');
      setIsSubmitting(false);
      return;
    }

    try {
      await apiFetch('/owner/properties', {
        method: 'POST',
        headers: getAuthHeader(token),
        body: JSON.stringify({
          title,
          description,
          location,
          price,
          images: normalizedResult.normalized,
        }),
      });
      setTitle('');
      setDescription('');
      setLocation('');
      setPrice(1000);
      setImages([emptyImage(), emptyImage()]);
      await loadProperties();
      setSuccessMessage('Draft property created successfully.');
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
    setIsPublishingId(propertyId);
    try {
      await apiFetch(`/owner/properties/${propertyId}/publish`, {
        method: 'POST',
        headers: getAuthHeader(token),
      });
      await loadProperties();
      setSuccessMessage('Property published successfully.');
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Unable to publish property');
    } finally {
      setIsPublishingId(null);
    }
  }

  async function deleteProperty(propertyId: string) {
    if (!token) {
      return;
    }

    setActionError(null);
    setIsDeletingId(propertyId);
    try {
      await apiFetch<{ success: boolean }>(`/owner/properties/${propertyId}`, {
        method: 'DELETE',
        headers: getAuthHeader(token),
      });
      await loadProperties();
      setSuccessMessage('Property deleted successfully.');
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Unable to delete property');
    } finally {
      setIsDeletingId(null);
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

  function beginEditDraft(property: PropertyRecord) {
    if (property.status !== 'DRAFT') {
      return;
    }

    setEditingPropertyId(property.id);
    setEditTitle(property.title);
    setEditDescription(property.description);
    setEditLocation(property.location);
    setEditPrice(property.price);

    const mappedImages = property.images.map((image) => ({
      url: image.url,
      mimeType: image.mimeType as ImageInput['mimeType'],
      size: image.size,
    }));

    const normalizedImages = mappedImages.length >= 2 ? mappedImages : [emptyImage(), emptyImage()];
    setEditImages(normalizedImages);
    setInitialEditSnapshot(
      JSON.stringify({
        title: property.title,
        description: property.description,
        location: property.location,
        price: property.price,
        images: normalizedImages,
      }),
    );
    setActionError(null);
  }

  const hasUnsavedDraftChanges = useMemo(() => {
    if (!editingPropertyId) {
      return false;
    }

    const currentSnapshot = JSON.stringify({
      title: editTitle,
      description: editDescription,
      location: editLocation,
      price: editPrice,
      images: editImages,
    });
    return currentSnapshot !== initialEditSnapshot;
  }, [
    editingPropertyId,
    editTitle,
    editDescription,
    editLocation,
    editPrice,
    editImages,
    initialEditSnapshot,
  ]);

  function cancelEditDraft() {
    if (hasUnsavedDraftChanges) {
      const approved = window.confirm(
        'You have unsaved draft changes. Discard them?',
      );
      if (!approved) {
        return;
      }
    }

    setEditingPropertyId(null);
    setEditTitle('');
    setEditDescription('');
    setEditLocation('');
    setEditPrice(1000);
    setEditImages([emptyImage(), emptyImage()]);
    setInitialEditSnapshot('');
  }

  function updateEditImage(index: number, next: Partial<ImageInput>) {
    setEditImages((current) =>
      current.map((image, i) => (i === index ? { ...image, ...next } : image)),
    );
  }

  function addEditImageRow() {
    if (editImages.length >= 10) {
      return;
    }
    setEditImages((current) => [...current, emptyImage()]);
  }

  function removeEditImageRow(index: number) {
    if (editImages.length <= 2) {
      return;
    }
    setEditImages((current) => current.filter((_, i) => i !== index));
  }

  async function saveEditDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !editingPropertyId) {
      return;
    }

    setActionError(null);
    setIsSavingEdit(true);

    const normalizedResult = validateAndNormalizeImages(editImages);
    setEditImages(normalizedResult.normalized);
    if (!normalizedResult.valid) {
      setActionError(normalizedResult.message ?? 'Invalid image URLs.');
      setIsSavingEdit(false);
      return;
    }

    try {
      await apiFetch(`/owner/properties/${editingPropertyId}`, {
        method: 'PATCH',
        headers: getAuthHeader(token),
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          location: editLocation,
          price: editPrice,
          images: normalizedResult.normalized,
        }),
      });
      setEditingPropertyId(null);
      setEditTitle('');
      setEditDescription('');
      setEditLocation('');
      setEditPrice(1000);
      setEditImages([emptyImage(), emptyImage()]);
      setInitialEditSnapshot('');
      await loadProperties();
      setSuccessMessage('Draft changes saved successfully.');
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Unable to save draft changes');
    } finally {
      setIsSavingEdit(false);
    }
  }

  useEffect(() => {
    if (!editingPropertyId) {
      return;
    }

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      const currentSnapshot = JSON.stringify({
        title: editTitle,
        description: editDescription,
        location: editLocation,
        price: editPrice,
        images: editImages,
      });
      if (currentSnapshot === initialEditSnapshot) {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [
    editingPropertyId,
    editTitle,
    editDescription,
    editLocation,
    editPrice,
    editImages,
    initialEditSnapshot,
  ]);

  const draftCount = items.filter((property) => property.status === 'DRAFT').length;
  const publishedCount = items.filter((property) => property.status === 'PUBLISHED').length;
  const archivedCount = items.filter((property) => property.status === 'ARCHIVED').length;

  return (
    <AuthGuard allowedRoles={['OWNER']}>
      <main className="page-shell max-w-5xl">
        <FeedbackToast
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />

        <header className="dashboard-hero flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-950">Owner Dashboard</h1>
            <p className="mt-2 text-blue-700">Manage your listings, {user?.name ?? 'Owner'}.</p>
            {lastUpdated ? (
              <p className="mt-1 text-xs font-medium text-blue-600">Last synced: {lastUpdated}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadProperties()}
              className="btn-secondary px-3 py-2 text-sm"
            >
              Refresh
            </button>
            <LogoutButton />
          </div>
        </header>

        <section className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <article className="metric-tile p-4">
            <p className="text-sm text-blue-700">Draft Listings</p>
            <p className="mt-1 text-2xl font-bold text-blue-950">{draftCount}</p>
          </article>
          <article className="metric-tile p-4">
            <p className="text-sm text-blue-700">Published Listings</p>
            <p className="mt-1 text-2xl font-bold text-blue-950">{publishedCount}</p>
          </article>
          <article className="metric-tile p-4">
            <p className="text-sm text-blue-700">Archived Listings</p>
            <p className="mt-1 text-2xl font-bold text-blue-950">{archivedCount}</p>
          </article>
        </section>

        <section className="panel mt-8 p-6">
          <div>
            <h2 className="text-xl font-semibold text-blue-950">Create Property</h2>
            <p className="mt-1 text-sm text-blue-700">
              Draft first, then publish after your listing is complete and validated.
            </p>
          </div>
          <form onSubmit={onCreate} className="mt-4 space-y-3">
            <input
              className="field"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <textarea
              className="field min-h-24"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <input
              className="field"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
            <input
              className="field"
              type="number"
              min={1}
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              required
            />

            <div className="space-y-3 rounded-md border border-blue-100 bg-blue-50/40 p-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-blue-900">Images (min 2)</h3>
                <button
                  type="button"
                  onClick={addImageRow}
                  className="btn-secondary px-2 py-1 text-sm"
                >
                  Add image
                </button>
              </div>

              {images.map((image, index) => (
                <div key={index} className="grid gap-2 rounded-md border border-blue-100 bg-white p-3 sm:grid-cols-4">
                  <input
                    className="field sm:col-span-2"
                    placeholder="Image URL"
                    value={image.url}
                    onChange={(e) => updateImage(index, { url: e.target.value })}
                    required
                  />
                  <select
                    className="field"
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
                      className="field"
                      type="number"
                      min={1}
                      max={5000000}
                      value={image.size}
                      onChange={(e) => updateImage(index, { size: Number(e.target.value) })}
                    />
                    <button
                      type="button"
                      onClick={() => removeImageRow(index)}
                      className="btn-secondary px-2 py-1 text-sm"
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
              className="btn-primary px-4 py-2 disabled:opacity-60"
            >
              {isSubmitting ? 'Creating...' : 'Create draft'}
            </button>
          </form>
        </section>

        <section className="panel mt-8 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-blue-950">My Properties</h2>
              <p className="mt-1 text-sm text-blue-700">Track status and run publish or delete actions.</p>
            </div>
            <select
              className="field w-auto min-w-40"
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

          {isLoading ? <p className="mt-4 text-blue-700">Loading properties...</p> : null}
          {error ? <p className="mt-4 text-red-600">{error}</p> : null}

          <div className="mt-4 space-y-3">
            {items.map((property) => (
              <article key={property.id} className="rounded-lg border border-blue-100 bg-blue-50/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-blue-950">{property.title}</h3>
                    <p className="text-sm text-blue-700">
                      {property.location} • ${property.price.toLocaleString()}
                    </p>
                    <span
                      className={`mt-2 ${
                        property.status === 'PUBLISHED'
                          ? 'status-chip published'
                          : property.status === 'ARCHIVED'
                            ? 'status-chip archived'
                            : 'status-chip draft'
                      }`}
                    >
                      {property.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {property.status === 'DRAFT' ? (
                      <button
                        type="button"
                        onClick={() => beginEditDraft(property)}
                        className="btn-secondary px-3 py-1 text-sm"
                      >
                        Edit
                      </button>
                    ) : null}
                    {property.status === 'DRAFT' ? (
                      <button
                        type="button"
                        onClick={() => publishProperty(property.id)}
                        disabled={isPublishingId === property.id}
                        className="btn-secondary px-3 py-1 text-sm disabled:opacity-60"
                      >
                        {isPublishingId === property.id ? 'Publishing...' : 'Publish'}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => deleteProperty(property.id)}
                      disabled={isDeletingId === property.id}
                      className="btn-secondary px-3 py-1 text-sm text-red-700 disabled:opacity-60"
                    >
                      {isDeletingId === property.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>

                {editingPropertyId === property.id ? (
                  <form onSubmit={saveEditDraft} className="mt-4 space-y-3 rounded-md border border-blue-100 bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-blue-900">Edit Draft</h4>
                      <button
                        type="button"
                        onClick={cancelEditDraft}
                        className="btn-secondary px-2 py-1 text-xs"
                      >
                        Cancel
                      </button>
                    </div>

                    <input
                      className="field"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Title"
                      required
                    />
                    <textarea
                      className="field min-h-24"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Description"
                      required
                    />
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <input
                        className="field"
                        value={editLocation}
                        onChange={(e) => setEditLocation(e.target.value)}
                        placeholder="Location"
                        required
                      />
                      <input
                        className="field"
                        type="number"
                        min={1}
                        value={editPrice}
                        onChange={(e) => setEditPrice(Number(e.target.value))}
                        placeholder="Price"
                        required
                      />
                    </div>

                    <div className="space-y-2 rounded-md border border-blue-100 bg-blue-50/40 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-900">Images (min 2)</p>
                        <button
                          type="button"
                          onClick={addEditImageRow}
                          className="btn-secondary px-2 py-1 text-xs"
                        >
                          Add image
                        </button>
                      </div>

                      {editImages.map((image, index) => (
                        <div key={index} className="grid gap-2 rounded-md border border-blue-100 bg-white p-3 sm:grid-cols-4">
                          <input
                            className="field sm:col-span-2"
                            placeholder="Image URL"
                            value={image.url}
                            onChange={(e) => updateEditImage(index, { url: e.target.value })}
                            required
                          />
                          <select
                            className="field"
                            value={image.mimeType}
                            onChange={(e) =>
                              updateEditImage(index, {
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
                              className="field"
                              type="number"
                              min={1}
                              max={5000000}
                              value={image.size}
                              onChange={(e) =>
                                updateEditImage(index, { size: Number(e.target.value) })
                              }
                            />
                            <button
                              type="button"
                              onClick={() => removeEditImageRow(index)}
                              className="btn-secondary px-2 py-1 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingEdit}
                      className="btn-primary px-3 py-2 text-sm disabled:opacity-60"
                    >
                      {isSavingEdit ? 'Saving...' : 'Save Draft'}
                    </button>
                  </form>
                ) : null}
              </article>
            ))}
            {!isLoading && items.length === 0 ? (
              <p className="text-blue-700">No properties found for this filter.</p>
            ) : null}
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}
