"use client";

import { AuthGuard } from '../../../components/auth-guard';
import { LogoutButton } from '../../../components/logout-button';
import { useAuthStore } from '../../../store/auth-store';

export default function OwnerDashboardPage() {
  const user = useAuthStore((state) => state.user);

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
      </main>
    </AuthGuard>
  );
}
