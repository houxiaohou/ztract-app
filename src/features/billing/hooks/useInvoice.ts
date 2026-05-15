import { useMutation } from '@tanstack/react-query';

import { generateInvoice } from '@/features/billing/api';
import type { InvoiceResponse } from '@/features/billing/types';
import type { ApiError } from '@/lib/api';

export function useInvoice() {
  return useMutation<InvoiceResponse, ApiError, string>({
    mutationFn: (packId) => generateInvoice(packId),
  });
}
