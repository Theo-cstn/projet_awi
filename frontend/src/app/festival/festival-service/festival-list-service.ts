import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Festival } from '../../types/festival-dto';

@Injectable({ providedIn: 'root' })
export class FestivalListService {
  private readonly apiUrl = 'https://localhost:4000/api/festivals/'; // URL du backend
  private readonly _festivals = signal<Festival[]>([]); // Signal pour stocker les festivals
  readonly festivals = this._festivals.asReadonly(); // Signal en lecture seule

  showForm: boolean = false;
  lastId: number = 2;

  constructor(private http: HttpClient) {
    // Charger les festivals dès que le service est injecté
    this.loadFestivals();
  }

  /**
   * Charge les festivals depuis le backend.
   */
  loadFestivals(): void {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => {
        const festivals: Festival[] = data.map(festival => ({
          id: festival.festival_id,
          nom: festival.festival_nom,
          date_debut: new Date(festival.date_debut), // Conversion en Date
          date_fin: new Date(festival.date_fin), // Conversion en Date
          nbTablesPetites: festival.stock_tables_petites,
          nbTablesGrandes: festival.stock_tables_grandes,
          nbTablesMairie: festival.stock_tables_mairie,
          nbTotalTables: festival.stock_tables_petites + festival.stock_tables_grandes + festival.stock_tables_mairie, // Calcul automatique
          zonesTarifaires: festival.zones_tarifaires.map((zone: any) => ({
            id: zone.id,
            nom: zone.nom,
            prixTable: zone.prix_table,
            prixM: zone.prix_table / 4, // Calcul automatique du prix au m²
            zonesPlan: zone.zones_plan.map((plan: any) => ({
              id: plan.id,
              nom: plan.nom,
              nbTables: plan.nombre_tables,
            })),
            nbTotalTables: zone.zones_plan.reduce((sum: number, plan: any) => sum + plan.nombre_tables, 0), // Calcul automatique du nombre total de tables
            nbTablesLibres: zone.nb_tables_libres ?? zone.zones_plan.reduce((sum: number, plan: any) => sum + plan.nombre_tables, 0), // Calcul automatique des tables libres
          })),
        }));
        this._festivals.set(festivals);
      },
      error: (err) => console.error('Erreur lors du chargement des festivals :', err),
    });
  }

  /**
   * Supprime un festival par son ID.
   */
  onRemove(idFestival: number): void {
    this.http.delete(`${this.apiUrl}${idFestival}`).subscribe({
      next: () => {
        this._festivals.update((festivalList) =>
          festivalList.filter((festival) => festival.id !== idFestival)
        );
        console.log(`Festival avec l'ID ${idFestival} supprimé avec succès.`);
      },
      error: (err) => console.error('Erreur lors de la suppression du festival :', err),
    });
  }

  /**
   * Trouve un festival par son ID.
   */
  findById(id: number): Festival | undefined {
    return this._festivals().find((f) => f.id === id);
  }

  /**
   * Ajoute un nouveau festival.
   */
  onAdd(newFestival: Omit<Festival, 'id'>): void {
    this.http.post<{ message: string; id: number }>(this.apiUrl, newFestival).subscribe({
      next: (response) => {
        console.log('Festival ajouté avec succès :', response);
        // Recharger la liste des festivals après l'ajout
        this.loadFestivals();
      },
      error: (err) => console.error('Erreur lors de l\'ajout du festival :', err),
    });
  }

  /**
   * Met à jour un festival existant.
   */
  update(partial: Partial<Festival> & { id: number }): void {
    this._festivals.update((festivalList) =>
      festivalList.map((f) => (f.id === partial.id ? { ...f, ...partial } : f))
    );
  }

  /**
   * Supprime tous les festivals.
   */
  removeAll(): void {
    this._festivals.set([]);
  }
}