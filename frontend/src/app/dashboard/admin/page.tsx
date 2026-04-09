"use client";

import { AuthGuard } from '../../../components/auth-guard';
import { LogoutButton } from '../../../components/logout-button';
import { useAuthStore } from '../../../store/auth-store';

export default function AdminDashboardPage() {
  const user = useAuthStore((state) => state.user);

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
      </main>
    </AuthGuard>
  );
}
