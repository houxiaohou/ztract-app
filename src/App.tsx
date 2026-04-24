import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { queryClient } from '@/lib/queryClient';
import { RootLayout } from '@/layouts/RootLayout';
import HomePage from '@/pages/HomePage';
import NotFoundPage from '@/pages/NotFoundPage';
import AuthSignInPage from '@/pages/AuthSignInPage';
import AuthGoogleCallbackPage from '@/pages/AuthGoogleCallbackPage';
import { Toaster } from '@/components/ui/sonner';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<RootLayout />}>
            <Route index element={<HomePage />} />
            <Route path="auth">
              <Route path="sign-in" element={<AuthSignInPage />} />
              <Route path="google" element={<AuthGoogleCallbackPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
      {import.meta.env.DEV ? <ReactQueryDevtools buttonPosition="bottom-right" /> : null}
    </QueryClientProvider>
  );
}
