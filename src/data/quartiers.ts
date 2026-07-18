// Base de quartiers pour Cotonou et Abomey-Calavi.
// Cotonou : 13 arrondissements officiels (source : Mairie de Cotonou).
//   Le 4e arrondissement n'a pas de liste de quartiers publiée officiellement — omis.
// Abomey-Calavi : 9 arrondissements, localités agrégées depuis les données du recensement
//   (villages, quartiers, hameaux confondus — tous traités comme "quartier" ici).

export type Quartier = {
  nom: string
  arrondissement: string
  ville: 'Cotonou' | 'Abomey-Calavi'
}

const cotonou = (arrondissement: string, noms: string[]): Quartier[] =>
  noms.map(nom => ({ nom, arrondissement, ville: 'Cotonou' as const }))

const calavi = (arrondissement: string, noms: string[]): Quartier[] =>
  noms.map(nom => ({ nom, arrondissement, ville: 'Abomey-Calavi' as const }))

export const QUARTIERS: Quartier[] = [
  // ── Cotonou ──────────────────────────────────────────────────────────────
  ...cotonou('1er arrondissement', [
    'Avotrou-Aïmonlonfidé', 'Avotrou-Gbégo', 'Avotrou-Houézèkomè', 'Dandji',
    'Dandji-Hokanmè', 'Donatin', 'Finagnon', "N'vènamèdé", 'Suru-Léré', 'Tanto',
    'Tchanhounkpamè', 'Tokplégbé', 'Yagbé',
  ]),
  ...cotonou('2e arrondissement', [
    'Ahouassa', 'Djèdjèlayé', 'Gankpodo', 'Irédé', 'Kowégbo', 'Kpondehou Tcheme',
    'Lom-Nava', 'Minontchou', 'Sènadé', 'Sènadé Sekou', 'Yénawa', 'Yénawa Daho',
  ]),
  ...cotonou('3e arrondissement', [
    'Adjégounlè', 'Agbato', 'Agbondjèdo', 'Ayélawadjè 1', 'Ayélawadjè 2', 'Fifatin',
    'Gbénonkpo', 'Hlacomey', 'Kpankpan', 'Midombo', 'Sègbeya-Nord', 'Sègbeya-Sud',
  ]),
  ...cotonou('5e arrondissement', [
    'Avlékété-Jonquet', 'Bokossi Tokpa', 'Dota', 'Gbédokpo', 'Gbéto', 'Guinkomey',
    'Mifongou', 'Missèbo', 'Missité', 'Nouveau-Pont', 'Tokpa-Hoho',
    'Xwlakodji-Kpodji', 'Xwlakodji-Plage', 'Zongo Ehuzu', 'Zongo Nima',
  ]),
  ...cotonou('6e arrondissement', [
    'Ahouansori Ladji', 'Ahouansori Agué', 'Ahouansori Towéta', 'Ahouansori Towéta Kpota',
    'Aïdjèdo', 'Aïdjèdo Ahito', 'Aïdjèdo Gbègo', 'Aïdjèdo Vignon', 'Dantokpa',
    'Djidjè Aïtchédji', 'Gbédjromédé', 'Gbédjromédé Sud', 'Hindé Nord', 'Jéricho Nord', 'Jéricho Sud',
  ]),
  ...cotonou('7e arrondissement', [
    'Dagbédji', 'Enagnon-Sikè', 'Fignon-Sikè', 'Gbèdomidji', 'Gbènan', 'Gbèwa',
    'Missité-Sikè', 'Sèdami', 'Sèdjro Saint-Michel', 'Sèhogan', 'Todoté', 'Yévèdo',
  ]),
  ...cotonou('8e arrondissement', [
    'Agontinkon', 'Gbèdagba', 'Houéhoun', 'Houénoussou', 'Médédjro', 'Minonkpo', 'Tonato',
  ]),
  ...cotonou('9e arrondissement', [
    'Fifadji', 'Kindonou', 'Mènontin', 'Vossa', 'Vossa-Kpodji', 'Zogbo', 'Zogbohouè',
  ]),
  ...cotonou('10e arrondissement', [
    'Gbénonkpo', 'Midédji', 'Missèkplé', 'Missogbé', 'Sètovi', 'Yenawa-Fifadji',
  ]),
  ...cotonou('11e arrondissement', [
    'Gbèdiga Guèdèhounguè', 'Gbégamey Ahito', 'Gbégamey Centre', 'Gbégamey Dodo Ayidjè',
    'Gbégamey Gbagoudo', 'Gbégamey Mifongou', 'Houéyiho', 'Houéyiho Tanou',
    'Saint Jean Gbèdiga', 'Vodjè Allobatin', 'Vodjè Ayidoté', 'Vodjè Centre', 'Vodjè Finagnon',
  ]),
  ...cotonou('12e arrondissement', [
    'Ahouanlèko', 'Aïbatin Dodo', 'Akogbato', 'Cadjèhoun Agonga', 'Cadjèhoun Aupiais',
    'Cadjèhoun Azalokogon', 'Cadjèhoun Détinsa', 'Cadjèhoun Gare', 'Cadjèhoun Kpota',
    'Fidjrossè Centre', 'Fidjrossè Kpota', 'Fiyégnon Houta', 'Fiyégnon Jacquot',
    'Gbodjètin', 'Haie Vive-Cocotiers', 'Hlazounto', 'Vodjè Kpota',
  ]),
  ...cotonou('13e arrondissement', [
    'Agla Agongbomè', 'Agla Akplomey', 'Agla Centre', 'Agla Figaro', 'Agla Finafa',
    'Agla Les Pylônes', 'Agla Petit Château', 'Aïbatin Kpota', 'Cité Eucharistie',
    'Gbèdégbé', 'Houénoussou',
  ]),

  // ── Abomey-Calavi ────────────────────────────────────────────────────────
  ...calavi('Godomey', [
    'Togbin-Daho', 'Togbin-Kpèvi', 'Togbin-Fandji', 'Djèkpota', 'Aklakou', 'Ganganzounmè',
    'Ningboto', "Godomey-N'Gbèho", 'Dèkoungbé-Église', 'Gninkindji', 'Hêdomè',
    'Abikouholi', 'Fignonhou', 'Amahoun', 'Dèkoungbé', 'Agbo Codji Sèdégbé',
    'Logbozounkpa', 'Cococodji', 'Plateau', 'Zounga', 'Dénou', 'Cocotomey',
    'Ounvènoumèdé', 'Godomey', 'Sèdjannako', 'Aïmèvo', 'Gbodjè-Womey',
    'Atrokpo-Codji', 'Fandji', 'Tokpa', 'La-Paix', 'Yolomahouto', 'Salamey',
    'Finafa', 'Hlouacomey', 'Nonhouénou', 'Hounsa-Agbodokpa', 'Godomey-Togoudo',
    'Sodo', 'Sèdomey', 'Djoukpa-Togoudo', 'Gbègnigan-Midokpo', 'Assrossa',
    'Womey-Centre', 'Agonkanmey', 'Womey-Yénawa', 'Yénandjro', 'Alègléta',
    'Tankpè-Togoudo',
  ]),
  ...calavi('Hêvié', [
    'Akossavié', 'Sogan', 'Houinmè-Daho', 'Handomè', 'Houinmè', 'Hounzévié',
    'Adovié', 'Kissovié', 'Fonkomè', 'Hêvié', 'Zoungo', 'Dossounou', 'Salédja',
    'Gbécomè', 'Akokponawa',
  ]),
  ...calavi('Abomey-Calavi', [
    'Cité-la-Victoire', 'Tokpa-Zoungo-Sud', 'Tankpê-Yoho', 'Tokpa-Zoungo-Nord',
    'Tchinangbégbo', 'Finafa', 'Abomey-Calavi', 'Alédjo', 'Agori', 'Sèmè',
    'Aïtchédji', 'Agamandin', 'Fandji', 'Aïfa-Calavi', 'Gbodjo', 'Zopah-Kokpo',
    'Cité-les-Palmiers', 'Zoundja', 'Kansounkpa', 'Fanto', 'Houédakomè', 'Atadjè',
    'Dodja',
  ]),
  ...calavi('Togba', [
    'Maria-Gléta', 'Tankpè-Tanmè', 'Sakomè', 'Houèto', 'Togba', 'Fifonsi', 'Doga',
    'Aïdégnon', 'Tokan', 'Somè', 'Ahossougbéta', 'Ouéga-Tokpa', 'Ouéga-Agué', 'Drabo',
  ]),
  ...calavi('Ouèdo', [
    'Ahouato', 'Alansankomè', 'Dessato', 'Adjagbo-Aïdjèdo', 'Adjagbo', 'Kpossidja',
    'Dassèkomey', 'Kpossidja 2', 'Dodja', 'Ouèdo',
  ]),
  ...calavi('Akassato', [
    'Zogbadjè', 'Zopah-Akassato', 'Houèkè-Gbo', 'Houèkè-Honou', 'Akassato',
    'Misséssinto', 'Adjagbo', 'Glo-Tokpa', 'Zèkanmey-Domè', 'Agassa-Godomey',
    'Gbétagbo', 'Agonmé', 'Zayiéra', 'Agonsoudja', 'Kolètin',
    'Kpodji-Les-Monts',
  ]),
  ...calavi('Glo-Djigbé', [
    'Golo-Djigbé', 'Azonsa', 'Domey-Gbo', 'Agonkèssa', 'Zèkanmey', 'Adjamè', 'Yêkon-Aga',
    'Yèkon-Do', 'Espace-Saint', 'Djissoukpa', 'Lohoussa', 'Golo-Fanto',
    'Alladacomè', 'Agongbé',
  ]),
  ...calavi('Zinvié', [
    'Dokomè', 'Adjogansa', 'Gbodjoko', 'Gbodjè', 'Yèvié', 'Sokan', 'Zinvié-Agolèdji', 'Yèvié-Nougo', 'Zinvié',
    'Zinvié-Fandji', 'Dangbodji', 'Tanmè', 'Zinvié-Zounmè', 'Wawata', 'Kpotomey',
    'Wawata-Todja',
  ]),
  ...calavi('Kpanroun', [
    'Houégoudo', 'Avadjètomè', 'Kpé', 'Fandji', 'Dèdo', 'Kplassouhoué', 'Avagbé', 'Kpaviédja',
    'Hadjanaho', 'Kpanroun', 'Bozoun', 'Lokogbé-Kpèvi', 'Djigbo', 'Anagbo', 'Ahowégodo',
  ]),
]

function norm(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

/** Recherche tolérante aux accents, sur nom + arrondissement, limitée aux villes gérées. */
export function rechercherQuartiers(query: string, ville?: 'Cotonou' | 'Abomey-Calavi', limit = 8): Quartier[] {
  const q = norm(query)
  if (q.length < 1) return []
  const pool = ville ? QUARTIERS.filter(x => x.ville === ville) : QUARTIERS
  return pool.filter(x => norm(x.nom).includes(q)).slice(0, limit)
}

/** Les deux villes couvertes par cette base (pour distinguer d'une saisie libre). */
export const VILLES_AVEC_QUARTIERS: Array<'Cotonou' | 'Abomey-Calavi'> = ['Cotonou', 'Abomey-Calavi']

/** Correspondance exacte (accent/casse insensible) — utilisé pour savoir si un quartier tapé est reconnu. */
export function trouverQuartierExact(nom: string): Quartier | undefined {
  const q = norm(nom)
  if (!q) return undefined
  return QUARTIERS.find(x => norm(x.nom) === q)
}
