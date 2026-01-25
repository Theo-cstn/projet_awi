export interface SuiviDto {
  editeur_id: number;
  editeur_nom: string;
  etat: 'PAS_CONTACTE' | 'CONTACTE' | 'DISCUSSION' | 'REFUS' | 'CONFIRME';
  compte_rendu?: string;
  responsable_id?: number;
  responsable_nom?: string;
  dates_contact: string[]; // Tableau de dates ISO
  nb_jeux: number;
}
