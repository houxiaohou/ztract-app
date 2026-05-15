import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { queryClient } from '@/lib/queryClient';
import { AppLayout } from '@/layouts/AppLayout';
import { ProjectDetailLayout } from '@/layouts/ProjectDetailLayout';
import { ProjectInitLayout } from '@/layouts/ProjectInitLayout';
import HomePage from '@/pages/HomePage';
import NotFoundPage from '@/pages/NotFoundPage';
import AuthSignInPage from '@/pages/AuthSignInPage';
import AuthGoogleCallbackPage from '@/pages/AuthGoogleCallbackPage';
import PricingPage from '@/pages/PricingPage';
import OrdersPage from '@/pages/OrdersPage';
import SettingsPage from '@/pages/SettingsPage';
import BillingSuccessPage from '@/pages/BillingSuccessPage';
import BillingCancelPage from '@/pages/BillingCancelPage';
import ProjectDocumentsPage from '@/pages/ProjectDocumentsPage';
import ProjectParsedDataPage from '@/pages/ProjectParsedDataPage';
import ProjectExportsPage from '@/pages/ProjectExportsPage';
import ProjectSchemaPage from '@/pages/ProjectSchemaPage';
import ProjectInitPage from '@/pages/ProjectInitPage';
import { Toaster } from '@/components/ui/sonner';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="billing/success" element={<BillingSuccessPage />} />
            <Route path="billing/cancel" element={<BillingCancelPage />} />
          </Route>
          <Route path="projects/:projectId/init" element={<ProjectInitLayout />}>
            <Route index element={<ProjectInitPage />} />
          </Route>
          <Route path="projects/:projectId" element={<ProjectDetailLayout />}>
            <Route index element={<Navigate to="documents" replace />} />
            <Route path="documents" element={<ProjectDocumentsPage />} />
            <Route path="parsed-data" element={<ProjectParsedDataPage />} />
            <Route path="exports" element={<ProjectExportsPage />} />
            <Route path="schema" element={<ProjectSchemaPage />} />
          </Route>
          <Route path="auth">
            <Route path="sign-in" element={<AuthSignInPage />} />
            <Route path="google" element={<AuthGoogleCallbackPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" />
      {import.meta.env.DEV ? <ReactQueryDevtools buttonPosition="bottom-right" /> : null}
    </QueryClientProvider>
  );
}
