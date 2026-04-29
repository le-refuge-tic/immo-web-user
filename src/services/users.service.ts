import api from './axios';
import type { User } from '../types';

export const usersService = {
  getAll: (params?: { page?: number; limit?: number; role?: string; actif?: boolean }) =>
    api.get<User[]>('/users', { params }).then((r) => r.data),

  getById: (id: number) =>
    api.get<User>(`/users/${id}`).then((r) => r.data),

  update: (id: number, data: Partial<User>) =>
    api.patch<User>(`/users/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/users/${id}`).then((r) => r.data),
};
