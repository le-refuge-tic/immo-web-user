import { describe, it, expect } from 'vitest'
import {
  finLendemain,
  libelleHoraires,
  prixParHeure,
  resumeSalle,
  reglesSalle,
  libelleConfiguration,
  libelleMobilier,
  detailsPrix,
} from '../salleFete'
import type { DetailsSalleFete } from '../../types/api'

const details = (surcharge: Partial<DetailsSalleFete> = {}): DetailsSalleFete => ({
  prix: 45000, duree_heures: 8, prix_par_heure: 5625, heures_min: 4, caution: 50000, frais_menage: 15000,
  capacite: 300, superficie_m2: 400, configuration: 'mixte', nb_tables: 30, nb_chaises: 300,
  parking: true, places_parking: 40, heure_ouverture: '08:00:00', heure_fin_max: '02:00:00',
  traiteur: 'libre', deco_autorisee: true, alcool_autorise: false, heure_fin_musique: '23:00:00',
  ...surcharge,
})

describe('resumeSalle', () => {
  it('« 300 personnes · min. 4 h »', () => {
    expect(resumeSalle(details())).toBe('300 personnes · min. 4 h')
  })
  it('accords au singulier', () => {
    expect(resumeSalle(details({ capacite: 1, heures_min: 1 }))).toBe('1 personne · min. 1 h')
  })
  it('sans détails : rien', () => {
    expect(resumeSalle(null)).toBeNull()
    expect(resumeSalle(undefined)).toBeNull()
  })
})

describe('prixParHeure', () => {
  it('utilise la valeur calculée par le serveur', () => {
    expect(prixParHeure(details({ prix_par_heure: 5625 }))).toBe(5625)
  })
  it('à défaut (ancienne réponse), la recalcule', () => {
    expect(prixParHeure(details({ prix_par_heure: undefined }))).toBe(5625)
    expect(prixParHeure(details({ prix: 10000, duree_heures: 3, prix_par_heure: undefined }))).toBe(3333)
  })
  it('une durée absente ou nulle ne divise pas par zéro', () => {
    expect(prixParHeure(details({ prix_par_heure: undefined, duree_heures: 0 }))).toBe(45000)
  })
})

describe('horaires', () => {
  it('fin après minuit : « le lendemain »', () => {
    expect(finLendemain('18:00:00', '02:00:00')).toBe(true)
    expect(finLendemain('08:00', '23:00')).toBe(false)
  })
  it('libellé lisible, sans les secondes', () => {
    expect(libelleHoraires(details({ heure_ouverture: '18:00:00', heure_fin_max: '02:00:00' }))).toBe('De 18:00 à 02:00 (le lendemain)')
    expect(libelleHoraires(details({ heure_ouverture: '08:00:00', heure_fin_max: '23:00:00' }))).toBe('De 08:00 à 23:00')
  })
})

describe('detailsPrix (bloc Tarif de la fiche)', () => {
  it('prix pour N heures, prix à l’heure, durée minimum, caution, ménage', () => {
    const lignes = detailsPrix(details()).map(l => `${l.libelle} : ${l.valeur.replace(/\s/g, ' ')}`)
    expect(lignes).toEqual([
      'Prix pour 8 h : 45 000 FCFA',
      'Soit, à l’heure : 5 625 FCFA',
      'Durée minimum : 4 heures',
      'Caution : 50 000 FCFA',
      'Frais de ménage : 15 000 FCFA',
    ])
  })
  it('une heure : pas de ligne « à l’heure » en double ; caution et ménage nuls omis', () => {
    const lignes = detailsPrix(details({ duree_heures: 1, prix_par_heure: 45000, caution: null, frais_menage: 0, heures_min: 1 })).map(l => l.libelle)
    expect(lignes).toEqual(['Prix à l’heure', 'Durée minimum'])
  })
})

describe('capacité et mobilier', () => {
  it('configuration en français', () => {
    expect(libelleConfiguration('plein_air')).toBe('Plein air')
    expect(libelleConfiguration('mixte')).toBe('Mixte')
  })
  it('mobilier fourni, seulement si renseigné', () => {
    expect(libelleMobilier(details())).toBe('30 tables · 300 chaises')
    expect(libelleMobilier(details({ nb_tables: null }))).toBe('300 chaises')
    expect(libelleMobilier(details({ nb_tables: 1, nb_chaises: 1 }))).toBe('1 table · 1 chaise')
    expect(libelleMobilier(details({ nb_tables: null, nb_chaises: null }))).toBeNull()
  })
})

describe('reglesSalle', () => {
  it('parking, horaires, traiteur, décoration, alcool et musique', () => {
    expect(reglesSalle(details())).toEqual([
      'Parking : 40 places',
      'De 08:00 à 02:00 (le lendemain)',
      'Traiteur libre',
      'Décoration autorisée',
      'Alcool interdit',
      'Musique jusqu’à 23:00',
    ])
  })
  it('sans parking ni musique limitée ; traiteur imposé ou inclus', () => {
    const r = reglesSalle(details({ parking: false, places_parking: null, heure_fin_musique: null, traiteur: 'impose', deco_autorisee: false, alcool_autorise: true }))
    expect(r).toEqual(['Pas de parking', 'De 08:00 à 02:00 (le lendemain)', 'Traiteur imposé', 'Décoration interdite', 'Alcool autorisé'])
    expect(reglesSalle(details({ traiteur: 'inclus' }))[2]).toBe('Traiteur inclus')
  })
  it('1 place : singulier', () => {
    expect(reglesSalle(details({ places_parking: 1 }))[0]).toBe('Parking : 1 place')
  })
})
