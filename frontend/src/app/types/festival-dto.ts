import { ZoneTarifaire } from "./zone-tarifaire-dto";

export interface Festival {
  /*
  id: number;
  nom: string;
  date: Date

  // Total des espaces disponibles (somme des zones)
  nombreTablesLibres: number;
  stock: {
    petites: number; // Nombre de petites tables disponibles
    grandes: number; // Nombre de grandes tables disponibles
    mairie: number;  // Nombre de tables mairie disponibles
  };
  zonesTarifaires: ZoneTarifaire[]; // Zones tarifaires du festival
*/
  id?: number;
  nom: string;
  date_debut: Date;
  date_fin: Date;
  nbTablesPetites: number;
  nbTablesGrandes: number;
  nbTablesMairie: number;
  nbTotalTables: number; // Calculé automatiquement
  zonesTarifaires: ZoneTarifaire[];
}