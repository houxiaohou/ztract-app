import { useMutation } from '@tanstack/react-query';

import { createCheckout } from '@/features/billing/api';
import type {
  CheckoutRequest,
  CheckoutResponse,
} from '@/features/billing/types';
import type { ApiError } from '@/lib/api';

export function useCheckout() {
  return useMutation<CheckoutResponse, ApiError, CheckoutRequest>({
    mutationFn: createCheckout,
  });
}
