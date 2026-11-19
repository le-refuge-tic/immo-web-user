import { describe, expect, it } from 'vitest'
import { etatRole, roleDeRepli, rolesUtilisables } from './roles'

describe('lot 13 : règles des rôles', () => {
  it('le rôle démarcheur n’est plus jamais proposé', () => {
    expect(rolesUtilisables(['prospect', 'demarcheur', 'proprietaire'])).toEqual(['prospect', 'proprietaire'])
  })

  it('repli : rôle principal, sinon propriétaire, sinon prospect', () => {
    expect(roleDeRepli({ role_principal: 'proprietaire', roles_actifs: ['proprietaire', 'demarcheur'] })).toBe('proprietaire')
    expect(roleDeRepli({ role_principal: 'demarcheur', roles_actifs: ['demarcheur', 'proprietaire'] })).toBe('proprietaire')
    expect(roleDeRepli({ role_principal: 'demarcheur', roles_actifs: ['demarcheur'] })).toBe('prospect')
    expect(roleDeRepli({ role: 'locataire' })).toBe('locataire')
    expect(roleDeRepli(null)).toBe('')
  })

  it('propriétaire : prospect activable, locataire seulement sur invitation (règles du backend)', () => {
    const actifs = ['proprietaire']
    expect(etatRole('prospect', actifs)).toBe('activable')
    expect(etatRole('locataire', actifs)).toBe('sur_invitation')
    expect(etatRole('proprietaire', actifs)).toBe('actif')
    expect(etatRole('proprietaire', ['prospect'])).toBe('activable')
  })
})
