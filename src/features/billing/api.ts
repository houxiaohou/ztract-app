import { api } from '@/lib/api';
import type {
  CheckoutRequest,
  CheckoutResponse,
  GiftResponse,
  InvoiceResponse,
  PaginatedQuotaPacks,
  QuotaPackRead,
  QuotaSummary,
  TierRead,
} from '@/features/billing/types';

export async function getMyQuota(): Promise<QuotaSummary> {
  const { data } = await api.get<QuotaSummary>('/quota/me');
  return data;
}

export async function listMyPacks(params: {
  page: number;
  size: number;
}): Promise<PaginatedQuotaPacks> {
  const { data } = await api.get<PaginatedQuotaPacks>('/quota/packs', {
    params,
  });
  return data;
}

export async function listTiers(): Promise<TierRead[]> {
  const { data } = await api.get<TierRead[]>('/billing/tiers');
  return data;
}

export async function createCheckout(
  payload: CheckoutRequest,
): Promise<CheckoutResponse> {
  const { data } = await api.post<CheckoutResponse>('/billing/checkout', payload);
  return data;
}

export async function getCheckoutStatus(sessionId: string): Promise<QuotaPackRead> {
  const { data } = await api.get<QuotaPackRead>(
    `/billing/checkout/${encodeURIComponent(sessionId)}`,
  );
  return data;
}

export async function generateInvoice(packId: string): Promise<InvoiceResponse> {
  const { data } = await api.post<InvoiceResponse>(
    `/billing/packs/${packId}/invoice`,
  );
  return data;
}

export async function claimSignupGift(): Promise<GiftResponse> {
  const { data } = await api.post<GiftResponse>('/quota/signup-gift');
  return data;
}
