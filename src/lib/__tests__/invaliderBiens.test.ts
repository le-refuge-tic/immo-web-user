import { afterEach, describe, expect, it } from 'vitest'
import { invaliderBiens, queryClient } from '../queryClient'
import { queryKeys } from '../../api/queryKeys'

const etat = (key: readonly unknown[]) => queryClient.getQueryState(key)

describe('invaliderBiens (cache après une écriture sur un bien, FE-A-004)', () => {
  afterEach(() => queryClient.clear())

  it('marque listes et fiches à relire', () => {
    queryClient.setQueryData(queryKeys.biens.list({ transaction: 'location' }), [])
    queryClient.setQueryData(queryKeys.biens.detail(5), { id: 5 })
    queryClient.setQueryData(queryKeys.favoris, [])

    invaliderBiens()

    expect(etat(queryKeys.biens.list({ transaction: 'location' }))?.isInvalidated).toBe(true)
    expect(etat(queryKeys.biens.detail(5))?.isInvalidated).toBe(true)
    // Les favoris ne dépendent pas d'une écriture sur un bien.
    expect(etat(queryKeys.favoris)?.isInvalidated).toBe(false)
  })

  it('retire du cache la fiche d’un bien supprimé', () => {
    queryClient.setQueryData(queryKeys.biens.detail(5), { id: 5 })
    queryClient.setQueryData(queryKeys.biens.detail(6), { id: 6 })

    invaliderBiens(5)

    expect(queryClient.getQueryData(queryKeys.biens.detail(5))).toBeUndefined()
    expect(queryClient.getQueryData(queryKeys.biens.detail(6))).toEqual({ id: 6 })
  })
})
