import axios from 'axios'
import { tokenStore } from '../utils/tokenStore'
import { BASE, auth } from './apiBase'
import { compressImage } from '../utils/compressImage'

export const userApi = {
  me: () =>
    axios.get(`${BASE}/users/me`, auth()).then(r => r.data),

  updateProfil: (body: any) =>
    axios.patch(`${BASE}/users/me`, body, auth()).then(r => r.data),

  changePassword: (body: any) =>
    axios.patch(`${BASE}/users/me/password`, body, auth()).then(r => r.data),

  uploadAvatar: async (file: File) => {
    const form = new FormData()
    form.append('photo', await compressImage(file, 800))
    return axios.post(`${BASE}/users/me/photo`, form, {
      headers: {
        Authorization: `Bearer ${tokenStore.getToken()}`,
        'Content-Type': 'multipart/form-data',
      },
    }).then(r => r.data)
  },

  uploadCip: (file: File) => {
    const form = new FormData()
    form.append('cip', file)
    return axios.post(`${BASE}/users/me/cip`, form, {
      headers: {
        Authorization: `Bearer ${tokenStore.getToken()}`,
        'Content-Type': 'multipart/form-data',
      },
    }).then(r => r.data)
  },

  uploadIfu: (file: File) => {
    const form = new FormData()
    form.append('ifu', file)
    return axios.post(`${BASE}/users/me/ifu`, form, {
      headers: {
        Authorization: `Bearer ${tokenStore.getToken()}`,
        'Content-Type': 'multipart/form-data',
      },
    }).then(r => r.data)
  },

  loyersStats: () =>
    axios.get(`${BASE}/users/me/loyers`, auth()).then(r => r.data),

  retrait: (body: any) =>
    axios.post(`${BASE}/users/me/retrait`, body, auth()).then(r => r.data),

  historiqueTransactions: () =>
    axios.get(`${BASE}/users/me/transactions`, auth()).then(r => r.data),
}
