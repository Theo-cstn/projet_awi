export interface Reservation {
    id?: number
  festival_id: number;
  type: 'Editeur' | 'Boutique' | 'Association' | 'Prestataire' | 'Autre';
  editeur_id?: number ;
  autre_nom_reservant?: string;

  nombre_prises: number;
  remise_generale: number;
  est_present: boolean;

  lignes: {
    zone_tarifaire_id: number;
    quantite: number;
    prix_unitaire_applique: number;
  }[];
    
}