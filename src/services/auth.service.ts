import api from './axios';
import type { AuthTokens, LoginPayload } from '../types';

export const authService = {
  login: (payload: LoginPayload) =>
    api.post<AuthTokens>('/auth/login', payload).then((r) => r.data),

  logout: () =>
    api.post('/auth/logout').then((r) => r.data),

  refresh: (refresh_token: string) =>
    api.post<AuthTokens>('/auth/refresh', { refresh_token }).then((r) => r.data),

  getProfile: () =>
    api.get('/auth/me').then((r) => r.data),
};
