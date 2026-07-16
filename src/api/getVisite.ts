import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

// Supervision admin des visites/réservations (litiges, annulations tardives, no-show).
// Nécessite l'endpoint backend GET /admin/visites (voir prompt backend).
export const getVisite = {
  list: (params?: any) => axios.get(`${BASE}/admin/visites`, { ...auth(), params }).then(r => r.data),
};
