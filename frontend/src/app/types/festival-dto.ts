import { ZoneTarifaire } from "./zone-tarifaire-dto";

export interface Festival {
  id: number;
  nom: string;
  nombreTablesLibres: number; // Total des espaces disponibles (somme des zones)
  stock: {
    petites: number; // Nombre de petites tables disponibles
    grandes: number; // Nombre de grandes tables disponibles
    mairie: number;  // Nombre de tables mairie disponibles
  };
  zonesTarifaires: ZoneTarifaire[]; // Zones tarifaires du festival
  createdAt: Date; // ← Garder pour l'affichage dans l'ordre des festivals ? (géré par le backend)

}