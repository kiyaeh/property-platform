"use client";

import { useEffect } from 'react';

type FeedbackToastProps = {
  message: string | null;
  variant?: 'success' | 'error';
  durationMs?: number;
  onClose: () => void;
};

export function FeedbackToast({
  message,
  variant = 'success',
  durationMs = 2600,
  onClose,
}: FeedbackToastProps) {
  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(timer);
  }, [message, durationMs, onClose]);

  if (!message) {
    return null;
  }

  const variantClasses =
    variant === 'error'
      ? 'border-red-200 bg-red-50 text-red-800'
      : 'border-emerald-200 bg-emerald-50 text-emerald-800';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed right-4 top-4 z-50 rounded-md border px-4 py-2 text-sm font-medium shadow-lg ${variantClasses}`}
    >
      {message}
    </div>
  );
}
