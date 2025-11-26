import { ZonePlan } from "./zone-plan-dto";

export interface ZoneTarifaire {
  id: number;
  nom: string;
  nbTotalTables: number; // Total des espaces dans cette zone
  nbTablesLibres?: number; // Espaces libres dans cette zone
  prixTable: number; // prix d'une table
  prixM: number;
  zonesPlan: ZonePlan[]
}