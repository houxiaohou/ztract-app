export interface QuotaSummary {
  pages_available: number;
  pages_total: number;
  pages_used: number;
  active_packs: number;
}

export interface QuotaPackRead {
  id: string;
  source: string;
  tier_key: string | null;
  display_name: string | null;
  pages_total: number;
  pages_used: number;
  pages_remaining: number;
  price_minor_units: number;
  currency: string;
  status: string;
  paid_at: string | null;
  expires_at: string | null;
  stripe_invoice_url: string | null;
  created_at: string;
}

export interface PaginatedQuotaPacks {
  items: QuotaPackRead[];
  page: number;
  size: number;
  total: number;
}

export interface TierRead {
  key: string;
  pages: number;
  display_name: string;
  prices: Record<string, number>;
  recommend: boolean;
}

export interface CheckoutRequest {
  tier_key: string;
  currency?: string | null;
}

export interface CheckoutResponse {
  checkout_url: string;
  pack_id: string;
  currency: string;
}

export interface InvoiceResponse {
  invoice_url: string;
}

export interface GiftResponse {
  granted: boolean;
  pack: QuotaPackRead | null;
  reason: string | null;
}
