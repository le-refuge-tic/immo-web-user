import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

// Supervision admin des délégations de gestion (propriétaire → démarcheur).
// Nécessite l'endpoint backend GET /admin/delegations (voir prompt backend).
export const getDelegation = {
  list: (params?: any) => axios.get(`${BASE}/admin/delegations`, { ...auth(), params }).then(r => r.data),
};
