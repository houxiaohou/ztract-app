import { useMutation } from '@tanstack/react-query';

import { sendOtp } from '@/features/auth/api';
import type { ApiError } from '@/lib/api';
import type { SendOtpRequest } from '@/features/auth/types';

export function useSendOtp() {
  return useMutation<void, ApiError, SendOtpRequest>({
    mutationFn: sendOtp,
  });
}
