import { describe, expect, it } from 'vitest'
import { compterNonLues, estAlerteLocataire, marquerLue, marquerToutesLues } from '../alertesLocataire'
import type { Notification } from '../../../../types/api'

const alerte = (over: Partial<Notification>): Notification =>
  ({ id: 1, type: 'info', lu: false, created_at: '2026-10-01T08:00:00.000Z', ...over }) as Notification

describe('alertes du locataire', () => {
  it('marquerLue ne change que l’alerte visée et laisse la liste d’origine intacte', () => {
    const liste = [alerte({ id: 1 }), alerte({ id: 2 })]
    const apres = marquerLue(liste, 2)

    expect(apres.map(n => n.lu)).toEqual([false, true])
    expect(liste.map(n => n.lu)).toEqual([false, false])
  })

  it('« tout lu » ne touche que les alertes sans rôle ou du rôle locataire (même filtre que le serveur)', () => {
    const liste = [alerte({ id: 1 }), alerte({ id: 2, target_role: 'locataire' }), alerte({ id: 3, target_role: 'proprietaire' })]

    expect(marquerToutesLues(liste).map(n => n.lu)).toEqual([true, true, false])
    expect(compterNonLues(liste)).toBe(2)
    expect(estAlerteLocataire(liste[2])).toBe(false)
  })
})
