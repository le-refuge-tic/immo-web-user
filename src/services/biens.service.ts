import api from './axios';
import type { Bien, StatutBien, TypeBien, TypeTransaction } from '../types';

export interface BiensFilters {
  page?: number;
  limit?: number;
  type?: TypeBien;
  transaction?: TypeTransaction;
  statut?: StatutBien;
  user_id?: number;
}

export const biensService = {
  getAll: (params?: BiensFilters) =>
    api.get<Bien[]>('/biens', { params }).then((r) => r.data),

  getById: (id: number) =>
    api.get<Bien>(`/biens/${id}`).then((r) => r.data),

  update: (id: number, data: Partial<Bien>) =>
    api.patch<Bien>(`/biens/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/biens/${id}`).then((r) => r.data),
};
