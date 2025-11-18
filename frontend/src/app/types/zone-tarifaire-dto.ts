export interface ZoneTarifaire {
  id: number;
  nom: string;
  nombreTablesTotal: number; // Total des espaces dans cette zone
  nombreTablesLibres: number; // Espaces libres dans cette zone
}