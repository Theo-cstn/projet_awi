export interface Festival {
  id: number;
  nom: string;
  nombreTablesLibres: number;
  createdAt: Date; // ← Garder pour l'affichage dans l'ordre des festivals ?
}