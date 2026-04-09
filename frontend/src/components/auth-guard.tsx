"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Role } from '../lib/types';
import { hasRequiredRole, useAuthStore } from '../store/auth-store';

type AuthGuardProps = {
  allowedRoles: Role[];
  children: React.ReactNode;
};

export function AuthGuard({ allowedRoles, children }: AuthGuardProps) {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!token) {
      router.replace('/login');
    }
  }, [token, isHydrated, router]);

  if (!isHydrated || !token) {
    return <p className="p-6 text-blue-800">Checking your session...</p>;
  }

  if (!hasRequiredRole(user?.role, allowedRoles)) {
    return (
      <div className="panel mx-auto my-10 max-w-lg border-amber-300 bg-amber-50 p-6 text-amber-900">
        <h2 className="text-xl font-semibold">Access denied</h2>
        <p className="mt-2">Your account does not have permission to view this page.</p>
        <Link className="mt-4 inline-block underline" href="/">
          Return home
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
