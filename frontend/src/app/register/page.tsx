"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { ApiError, apiFetch } from '../../lib/api';
import { AuthResponse, Role } from '../../lib/types';
import { useAuthStore } from '../../store/auth-store';

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('USER');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const session = await apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
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
      setError(err instanceof ApiError ? err.message : 'Unable to register');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-bold text-slate-900">Register</h1>
      <p className="mt-2 text-slate-600">Create your account for the property platform.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-xl border border-slate-200 p-5">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Full name</span>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Role</span>
          <select
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            <option value="USER">Regular User</option>
            <option value="OWNER">Property Owner</option>
          </select>
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-slate-900 px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        Already have an account?{' '}
        <Link className="font-semibold text-slate-900 underline" href="/login">
          Login
        </Link>
      </p>
    </main>
  );
}
