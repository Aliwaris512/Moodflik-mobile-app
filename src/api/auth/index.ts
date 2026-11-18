import { useMutation, useQuery } from '@tanstack/react-query';
import type { z } from 'zod';

import { api } from '@/api/client';
import {
  zActivationResult,
  zForgotPasswordResponse,
  type zLoginRequest,
  zLoginResponse,
  zMessageEnvelope,
  type zSignUpRequest,
  zValidateOtpResponse,
} from '@/api/generated/zod.gen';

import { pendingLogin } from './pending';

export type LoginInput = z.infer<typeof zLoginRequest>;
export type SignUpInput = z.infer<typeof zSignUpRequest>;

type UserStatus = { is_user_deactivated?: boolean; username?: string; email?: string } & Record<
  string,
  unknown
>;

export async function login(input: LoginInput) {
  const { data } = await api.post<unknown>('user/authorize/', input);
  const { data: info } = zLoginResponse.parse(data);
  const headers = { Authorization: `Bearer ${info.accessToken}` };
  // Deactivated accounts must reactivate before entering the app.
  const { data: user } = await api.get<UserStatus>(`user/${info.uuid}`, { headers });
  return {
    accessToken: info.accessToken,
    refreshToken: info.refreshToken,
    uuid: info.uuid,
    email: info.email,
    deactivated: Boolean(user.is_user_deactivated),
  };
}

export async function signUp(input: SignUpInput) {
  const { data } = await api.post<unknown>('user/', input);
  return zMessageEnvelope.parse(data);
}

export async function requestPasswordReset(email: string) {
  const { data } = await api.post<unknown>('user/request_forgotpassword/', { email });
  return zForgotPasswordResponse.parse(data);
}

export async function resendOtp(email: string) {
  const { data } = await api.post<unknown>('user/resendotp/', {
    email,
    validation_type: 'forgot password',
  });
  return zMessageEnvelope.parse(data);
}

export async function validateOtp(email: string, code: string) {
  const { data } = await api.post<unknown>('validate-otp/', {
    email,
    code,
    validation_type: 'forgot password',
  });
  return zValidateOtpResponse.parse(data);
}

export async function resetPassword(input: { email: string; code: number; password: string }) {
  const { data } = await api.patch<unknown>('forget_password/', input);
  return zMessageEnvelope.parse(data);
}

export async function activateAccount(uuid: string, token: string) {
  const { data } = await api.get<unknown>(`account/activate/${uuid}/${token}/`, {
    params: { client_type: 'mobile' },
  });
  return zActivationResult.parse(data);
}

export async function reactivateAccount() {
  const pending = pendingLogin.get();
  if (!pending) throw new Error('No session found, please login again.');
  const headers = { Authorization: `Bearer ${pending.token}` };
  const { data: user } = await api.get<UserStatus & { first_name?: string; last_name?: string }>(
    `user/${pending.uuid}`,
    { headers },
  );
  await api.patch(
    `user/${pending.uuid}/`,
    {
      username: user.username,
      email: user.email,
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      is_user_deactivated: false,
    },
    { headers },
  );
  return pending.token;
}

export const useLogin = () => useMutation({ mutationFn: login });
export const useSignUp = () => useMutation({ mutationFn: signUp });
export const useRequestPasswordReset = () => useMutation({ mutationFn: requestPasswordReset });
export const useResendOtp = () => useMutation({ mutationFn: resendOtp });
export const useValidateOtp = () =>
  useMutation({ mutationFn: (v: { email: string; code: string }) => validateOtp(v.email, v.code) });
export const useResetPassword = () => useMutation({ mutationFn: resetPassword });
export const useReactivateAccount = () => useMutation({ mutationFn: reactivateAccount });
export const useActivateAccount = (uuid: string, token: string) =>
  useQuery({
    queryKey: ['auth', 'activate', uuid, token],
    queryFn: () => activateAccount(uuid, token),
    retry: false,
  });
