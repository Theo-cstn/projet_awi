export interface Reservation {
  id?: number;
  festival_id: number;
  type: 'Editeur' | 'Boutique' | 'Association' | 'Prestataire' | 'Autre';
  editeur_id?: number;
  autre_nom_reservant?: string;

  nombre_prises: number;
  remise_generale: number;
  est_present: boolean;
  
  statut?: 'PRESENT' | 'FACTUREE' | 'PAYEE'; 
  

  date_creation?: string;
  date_facturation?: string;
  date_paiement?: string;

  lignes: {
    id?: number;
    zone_tarifaire_id: number;
    quantite: number;
    prix_moment_reservation: number;
  }[];

  jeux: {
    id?: number;
    jeu_id: number;
    nb_exemplaires: number;
    tables_occupees: number;
    zone_plan_id?: number;
  }[];
}