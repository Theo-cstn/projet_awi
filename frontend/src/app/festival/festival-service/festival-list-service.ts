import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Festival } from '../../types/festival-dto';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';


@Injectable({ providedIn: 'root' })
export class FestivalListService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/festivals`;

  private readonly _festivals = signal<Festival[]>([]); 
  readonly festivals = this._festivals.asReadonly();

  // Mapping des données reçues du backend vers le type Festival
  private mapFestival(data: any): Festival {
    return {
      id: data.festival_id,
      nom: data.festival_nom,
      date_debut: new Date(data.date_debut),
      date_fin: new Date(data.date_fin),
      nbTablesPetites: data.stock_tables_petites,
      nbTablesGrandes: data.stock_tables_grandes,
      nbTablesMairie: data.stock_tables_mairie,
      nbTotalTables: data.stock_tables_petites + data.stock_tables_grandes + data.stock_tables_mairie,
      zonesTarifaires: data.zones_tarifaires ? data.zones_tarifaires.map((zone: any) => ({
        id: zone.id,
        nom: zone.nom,
        prixTable: zone.prix_table,
        prixM: zone.prix_table / 4,
        zonesPlan: zone.zones_plan ? zone.zones_plan.map((plan: any) => ({
          id: plan.id,
          nom: plan.nom,
          nbTables: plan.nombre_tables,
        })) : [],
        nbTotalTables: zone.zones_plan ? zone.zones_plan.reduce((sum: number, plan: any) => sum + plan.nombre_tables, 0) : 0,
        nbTablesLibres: zone.nb_tables_libres ?? (zone.zones_plan ? zone.zones_plan.reduce((sum: number, plan: any) => sum + plan.nombre_tables, 0) : 0),
      })) : [],
    };
  }

  loadFestivals(): void {
    this.http.get<any[]>(this.apiUrl, { withCredentials: true }).subscribe({
      next: (data) => {
        const festivals = data.map(item => this.mapFestival(item));
        this._festivals.set(festivals);
      },
      error: (err) => console.error('Erreur loadFestivals :', err),
    });
  }


  getFestivalById(id: number): Observable<Festival> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, { withCredentials: true }).pipe(
      map(data => this.mapFestival(data))
    );
  }

  onAdd(newFestival: Omit<Festival, 'id'>): void {
    this.http.post<{ message: string; id: number }>(this.apiUrl, newFestival, { withCredentials: true }).subscribe({
      next: () => this.loadFestivals(),
      error: (err) => console.error('Erreur ajout :', err),
    });
  }

  update(festival: Partial<Festival> & { id: number }): void {
    const payload = {
      nom: festival.nom,
      date_debut: festival.date_debut,
      date_fin: festival.date_fin,
      stock_tables_petites: festival.nbTablesPetites,
      stock_tables_grandes: festival.nbTablesGrandes,
      stock_tables_mairie: festival.nbTablesMairie,
      zonesTarifaires: festival.zonesTarifaires
    };

    this.http.put(`${this.apiUrl}/${festival.id}`, payload, { withCredentials: true }).subscribe({
      next: () => {
        // Recharger les festivals pour avoir les données à jour
        this.loadFestivals();
      },
      error: (err) => console.error('Erreur update :', err)
    });
  }
}