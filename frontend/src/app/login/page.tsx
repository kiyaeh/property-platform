"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { apiFetch, ApiError } from '../../lib/api';
import { AuthResponse } from '../../lib/types';
import { useAuthStore } from '../../store/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const session = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setSession(session);

      if (session.user.role === 'ADMIN') {
        router.replace('/dashboard/admin');
      } else if (session.user.role === 'OWNER') {
        router.replace('/dashboard/owner');
      } else {
        router.replace('/dashboard/user');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to login');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell-tight flex min-h-screen items-center">
      <section className="w-full overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_18px_50px_rgba(29,78,216,0.14)]">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <aside className="hidden bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 p-8 text-white md:block">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">Welcome Back</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight">Access your dashboard and listings instantly.</h2>
            <p className="mt-4 text-sm text-blue-50/95">
              Manage properties, favorites, and account-specific workflows from a single control surface.
            </p>
          </aside>

          <div className="p-6 sm:p-8">
            <h1 className="text-4xl font-bold tracking-tight text-blue-950">Login</h1>
            <p className="mt-2 text-blue-700">Access your account to manage properties and favorites.</p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-blue-800">Email</span>
                <input
                  className="field"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-blue-800">Password</span>
                <input
                  className="field"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </label>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full px-4 py-2 disabled:opacity-60"
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <p className="mt-4 text-sm text-blue-700">
              Need an account?{' '}
              <Link className="font-semibold text-blue-950 underline" href="/register">
                Register
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
