import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Festival } from '../../types/festival-dto';
import { map, Observable, tap } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class FestivalListService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'https://localhost:4000/api/festivals';

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

    update(partial: Partial<Festival> & { id: number }): void {
    this.http.patch(`${this.apiUrl}/${partial.id}`, partial, { withCredentials: true }).subscribe({
      next: () => {
        this._festivals.update((festivalList) =>
          festivalList.map((f) => (f.id === partial.id ? { ...f, ...partial } : f))
        );
      },
      error: (err) => console.error('Erreur update :', err)
    });
  }
}