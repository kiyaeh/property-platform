"use client";

import { FormEvent, useState } from 'react';
import { ApiError, apiFetch, getAuthHeader } from '../lib/api';
import { useAuthStore } from '../store/auth-store';

type ContactOwnerFormProps = {
  propertyId: string;
};

export function ContactOwnerForm({ propertyId }: ContactOwnerFormProps) {
  const token = useAuthStore((state) => state.token);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      setError('Please login to contact the property owner.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await apiFetch<{ id: string }>(`/properties/${propertyId}/contact`, {
        method: 'POST',
        headers: getAuthHeader(token),
        body: JSON.stringify({ message }),
      });
      setSuccess('Message sent to the property owner.');
      setMessage('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to send message');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isHydrated) {
    return <p className="text-sm text-blue-500">Loading contact form...</p>;
  }

  return (
    <section className="panel mt-10 p-5">
      <h2 className="text-xl font-semibold text-blue-950">Contact Owner</h2>
      <p className="mt-1 text-sm text-blue-700">Ask availability, terms, or viewing details.</p>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <textarea
          className="field min-h-28"
          placeholder="Write your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          minLength={10}
          maxLength={1000}
          required
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary px-4 py-2 disabled:opacity-60"
        >
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </section>
  );
}
