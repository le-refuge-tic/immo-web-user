export type UserRole = 'client' | 'detenteur';

export interface User {
  id: number;
  role: UserRole;
  nom: string;
  prenom: string;
  telephone: string | null;
  email: string | null;
  profil_complet: boolean;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export type TypeBien = 'maison' | 'appart_vide' | 'appart_meuble' | 'guesthouse' | 'terrain';
export type TypeTransaction = 'vente' | 'location';
export type StatutBien = 'actif' | 'vendu' | 'loue' | 'archive';

export interface Localisation {
  id: number;
  pays: string;
  ville: string;
  quartier: string;
  adresse: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface Photo {
  id: number;
  url: string;
  is_principale: boolean;
}

export interface Piece {
  id: number;
  nom: string;
  superficie: number | null;
}

export interface DetailsMaison {
  id: number;
  nb_chambres: number;
  nb_salles_bain: number;
  superficie_batie: number | null;
  superficie_terrain: number | null;
  nb_etages: number | null;
}

export interface DetailsAppart {
  id: number;
  nb_chambres: number;
  nb_salles_bain: number;
  superficie: number | null;
  etage: number | null;
}

export interface DetailsTerrain {
  id: number;
  superficie: number;
  est_viabilise: boolean;
}

export interface Bien {
  id: number;
  user_id: number;
  user?: User;
  localisation: Localisation;
  type: TypeBien;
  transaction: TypeTransaction;
  prix: number;
  description: string | null;
  statut: StatutBien;
  created_at: string;
  updated_at: string;
  details_maison?: DetailsMaison | null;
  details_appart?: DetailsAppart | null;
  details_terrain?: DetailsTerrain | null;
  pieces: Piece[];
  photos: Photo[];
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface LoginPayload {
  email?: string;
  telephone?: string;
  password: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
