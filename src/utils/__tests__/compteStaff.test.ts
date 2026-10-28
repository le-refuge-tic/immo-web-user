import { describe, it, expect } from 'vitest'
import { CompteStaffRefuse, MESSAGE_COMPTE_STAFF, estCompteStaff } from '../compteStaff'
import { apiMessage } from '../apiMessage'

describe('estCompteStaff', () => {
  it.each(['admin', 'super_admin', 'commercial'])('reconnaît le rôle %s', (role) => {
    expect(estCompteStaff({ role })).toBe(true)
    expect(estCompteStaff({ role_principal: role })).toBe(true)
  })

  it.each(['prospect', 'proprietaire', 'demarcheur'])('laisse passer le rôle %s', (role) => {
    expect(estCompteStaff({ role, role_principal: role })).toBe(false)
  })

  it('sans utilisateur : pas staff', () => {
    expect(estCompteStaff(null)).toBe(false)
    expect(estCompteStaff(undefined)).toBe(false)
  })
})

describe('CompteStaffRefuse', () => {
  it("affiche le renvoi vers l'espace administration", () => {
    expect(apiMessage(new CompteStaffRefuse())).toBe(MESSAGE_COMPTE_STAFF)
  })
})
