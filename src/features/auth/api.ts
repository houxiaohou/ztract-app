import { api } from '@/lib/api';
import type {
  GoogleLoginRequest,
  SendOtpRequest,
  TokenResponse,
  UserRead,
  VerifyOtpRequest,
} from '@/features/auth/types';

export async function sendOtp(payload: SendOtpRequest): Promise<void> {
  await api.post('/auth/send-otp', payload);
}

export async function verifyOtp(payload: VerifyOtpRequest): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>('/auth/verify-otp', payload);
  return data;
}

export async function googleLogin(payload: GoogleLoginRequest): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>('/auth/google', payload);
  return data;
}

export async function getCurrentUser(): Promise<UserRead> {
  const { data } = await api.get<UserRead>('/auth/me');
  return data;
}
