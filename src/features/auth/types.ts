export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface SendOtpRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  code: string;
}

export interface GoogleLoginRequest {
  id_token: string;
}

export interface UserRead {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
}
