import { describe, it, expect } from 'vitest'
import { nomEtDescription, resumeCapacite, libelleLits, grouperEquipements, regles } from '../guesthouse'

describe('nomEtDescription', () => {
  it('guesthouse : 1re ligne = nom, la suite = description', () => {
    expect(nomEtDescription({ type: 'guesthouse', description: 'Villa Les Palmiers\n\nCalme, près de la plage.' }))
      .toEqual({ nom: 'Villa Les Palmiers', description: 'Calme, près de la plage.' })
  })
  it('ancienne guesthouse sans nom : description entière', () => {
    expect(nomEtDescription({ type: 'guesthouse', description: 'Duplex meublé' })).toEqual({ nom: null, description: 'Duplex meublé' })
  })
  it('autre type : jamais de nom extrait (non-régression)', () => {
    expect(nomEtDescription({ type: 'appart_vide', description: 'Ligne 1\n\nLigne 2' })).toEqual({ nom: null, description: 'Ligne 1\n\nLigne 2' })
  })
})

describe('resumeCapacite / libelleLits', () => {
  it('« 4 voyageurs · 2 chambres », accords au singulier', () => {
    expect(resumeCapacite({ capacite: 4, nb_chambres: 2 })).toBe('4 voyageurs · 2 chambres')
    expect(resumeCapacite({ capacite: 1, nb_chambres: 1 })).toBe('1 voyageur · 1 chambre')
    expect(resumeCapacite(null)).toBeNull()
  })
  it('lits lisibles', () => {
    expect(libelleLits([{ type: 'double', nombre: 1 }, { type: 'simple', nombre: 2 }])).toBe('1 lit double, 2 lits simples')
    expect(libelleLits([{ type: 'canape_lit', nombre: 1 }])).toBe('1 canapé-lit')
  })
})

describe('grouperEquipements', () => {
  it('groupe par catégorie dans l’ordre officiel, libellés français', () => {
    const g = grouperEquipements([
      { code: 'piscine', libelle: 'Piscine', categorie: 'exterieur', ordre: 190 },
      { code: 'wifi', libelle: 'Wi-Fi', categorie: 'base', ordre: 10 },
      { code: 'menage', libelle: 'Ménage', categorie: 'services', ordre: 340 },
      { code: 'clim', libelle: 'Climatisation', categorie: 'base', ordre: 20 },
    ])
    expect(g.map(x => x.libelle)).toEqual(['Base', 'Extérieur', 'Services'])
    expect(g[0].equipements.map(e => e.code)).toEqual(['wifi', 'clim'])
  })
  it('liste vide ou absente : aucun groupe', () => {
    expect(grouperEquipements(undefined)).toEqual([])
  })
})

describe('regles', () => {
  it('horaires et règles lisibles', () => {
    expect(regles({
      heure_arrivee: '14:00:00', heure_depart: '11:00:00',
      animaux_autorises: false, fetes_autorisees: true, fumeur_autorise: false,
      garage: true, type_acces_garage: 'commun',
    })).toEqual([
      'Arrivée à partir de 14:00',
      'Départ avant 11:00',
      'Animaux non autorisés',
      'Fêtes autorisées',
      'Non-fumeur',
      'Garage : accès commun',
    ])
  })
})
