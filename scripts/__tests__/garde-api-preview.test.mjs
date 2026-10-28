import { describe, expect, it } from 'vitest'
import { apiProdEnPreview } from '../garde-api-preview.mjs'

const PROD = 'https://immo-backend-uxr4.onrender.com/api/v1'
const STAGING = 'https://immo-backend-stagging.onrender.com/api/v1'

describe('apiProdEnPreview', () => {
  it('preview sur l\'API de production : refusée, avec la marche à suivre', () => {
    const msg = apiProdEnPreview({ apiUrl: PROD, vercelEnv: 'preview' })
    expect(msg).toMatch(/refusé/)
    expect(msg).toMatch(/immo-backend-uxr4\.onrender\.com/)
    expect(msg).toMatch(/Environment Variables/)
  })

  it('preview sur le staging : acceptée', () => {
    expect(apiProdEnPreview({ apiUrl: STAGING, vercelEnv: 'preview' })).toBeNull()
  })

  it('production sur l\'API de production : acceptée (c\'est son rôle)', () => {
    expect(apiProdEnPreview({ apiUrl: PROD, vercelEnv: 'production' })).toBeNull()
  })

  it('hors Vercel (poste local, CI) : jamais refusée', () => {
    expect(apiProdEnPreview({ apiUrl: PROD, vercelEnv: undefined })).toBeNull()
  })

  it('autorisation explicite : acceptée', () => {
    expect(apiProdEnPreview({ apiUrl: PROD, vercelEnv: 'preview', autorise: true })).toBeNull()
  })

  it('hôte de production ajouté par la configuration, sans tenir compte de la casse', () => {
    expect(apiProdEnPreview({ apiUrl: 'https://API.refuge.bj/api/v1', vercelEnv: 'preview', hotesSupplementaires: ['api.refuge.bj'] })).toMatch(/refusé/)
  })

  it('URL absente ou invalide : pas d\'erreur de la garde (les autres contrôles s\'en chargent)', () => {
    expect(apiProdEnPreview({ apiUrl: undefined, vercelEnv: 'preview' })).toBeNull()
    expect(apiProdEnPreview({ apiUrl: 'pas une url', vercelEnv: 'preview' })).toBeNull()
  })
})
