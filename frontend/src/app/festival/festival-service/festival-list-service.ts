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
      id: data.id, 
      nom: data.nom,
      date_debut: new Date(data.date_debut),
      date_fin: new Date(data.date_fin),
      nbTablesPetites: data.nbTablesPetites,
      nbTablesGrandes: data.nbTablesGrandes,
      nbTablesMairie: data.nbTablesMairie,
      
      nbTotalTables: data.nbTablesPetites + data.nbTablesGrandes + data.nbTablesMairie,
      
      zonesTarifaires: data.zonesTarifaires ? data.zonesTarifaires.map((zone: any) => ({
        id: zone.id,
        nom: zone.nom,
        prixTable: zone.prixTable,
        prixM: zone.prixM2,
        
        zonesPlan: zone.zonesPlan ? zone.zonesPlan.map((plan: any) => ({
          id: plan.id,
          nom: plan.nom,
          nbTables: plan.nbTables,
        })) : [],
        
        nbTotalTables: zone.nb_total_tables ?? (zone.zonesPlan ? zone.zonesPlan.reduce((sum: number, plan: any) => sum + plan.nbTables, 0) : 0),
        nbTablesLibres: zone.nb_tables_restantes ?? (zone.zonesPlan ? zone.zonesPlan.reduce((sum: number, plan: any) => sum + plan.nbTables, 0) : 0),
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
      nbTablesPetites: festival.nbTablesPetites,
      nbTablesGrandes: festival.nbTablesGrandes,
      nbTablesMairie: festival.nbTablesMairie,
      zonesTarifaires: festival.zonesTarifaires
    };

    this.http.put(`${this.apiUrl}/${festival.id}`, payload, { withCredentials: true }).subscribe({
      next: () => {
        this.loadFestivals();
      },
      error: (err) => console.error('Erreur update :', err)
    });
  }
}