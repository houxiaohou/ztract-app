import { useMutation } from '@tanstack/react-query';

import { verifyOtp } from '@/features/auth/api';
import type { ApiError } from '@/lib/api';
import { useAuthStore } from '@/features/auth/store';
import type { TokenResponse, VerifyOtpRequest } from '@/features/auth/types';

export function useVerifyOtp() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation<TokenResponse, ApiError, VerifyOtpRequest>({
    mutationFn: verifyOtp,
    onSuccess: (token) => {
      setSession(token);
    },
  });
}
