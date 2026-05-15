import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuthStore } from '@/features/auth/store';
import { SignupGiftHandler } from '@/features/billing/components/SignupGiftHandler';
import { TopNav } from '@/layouts/TopNav';

export function AppLayout() {
  const token = useAuthStore((state) => state.token);
  const location = useLocation();

  if (!token) {
    return (
      <Navigate to="/auth/sign-in" replace state={{ from: location.pathname }} />
    );
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <TopNav />
      <main className="mx-auto w-full px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>
      <SignupGiftHandler />
    </div>
  );
}
