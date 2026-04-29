import api from './axios';
import type { User } from '../types';

export const usersApi = {
  getAll: (params?: { page?: number; limit?: number; role?: string; actif?: boolean }) =>
    api.get<User[]>('/users', { params }).then((r) => r.data),

  getById: (id: number) =>
    api.get<User>(`/users/${id}`).then((r) => r.data),

  toggleActif: (id: number, actif: boolean) =>
    api.patch<User>(`/users/${id}`, { actif }).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/users/${id}`).then((r) => r.data),
};
