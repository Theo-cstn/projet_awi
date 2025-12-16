export function mapFestivalData(festival: any): any {
  return {
    id: festival.festival_id,
    nom: festival.festival_nom,
    date_debut: festival.date_debut,
    date_fin: festival.date_fin,
    nbTablesPetites: festival.stock_tables_petites,
    nbTablesGrandes: festival.stock_tables_grandes,
    nbTablesMairie: festival.stock_tables_mairie,
    zonesTarifaires: festival.zones_tarifaires.map((zone: any) => ({
      id: zone.id,
      nom: zone.nom,
      prixTable: zone.prix_table,
      prixM2: zone.prix_m2,
      zonesPlan: zone.zones_plan.map((plan: any) => ({
        id: plan.id,
        nom: plan.nom,
        nbTables: plan.nombre_tables,
      })),
    })),
  };
}