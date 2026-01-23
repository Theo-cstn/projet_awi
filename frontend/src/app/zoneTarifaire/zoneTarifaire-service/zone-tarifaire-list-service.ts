import { Injectable, signal, inject } from '@angular/core';
import { ZoneTarifaire } from '../../types/zone-tarifaire-dto';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ZoneTarifaireListService {
  private http = inject(HttpClient); 
  
  private readonly apiUrl = environment.apiUrl + '/festivals';
  
  private readonly _zones = signal<ZoneTarifaire[]>([]);
  readonly zones = this._zones.asReadonly();
  
  // Mapping backend → frontend 
  private mapZone(data: any): ZoneTarifaire {
    

    const rawPlans = data.zonesPlan ?? data.zones_plan ?? data.salles ?? [];

    const mappedPlans = rawPlans.map((p: any) => ({
        id: p.id,
        nom: p.nom,
        nbTables: p.nombre_tables ?? p.nbTables ?? 0 
    }));

    const mapped: ZoneTarifaire = {
      id: data.id, 
      nom: data.nom, 
      
      prixTable: typeof data.prix_table === 'string' ? parseFloat(data.prix_table) : (data.prix_table ?? 0),
      prixM: typeof data.prix_m2 === 'string' ? parseFloat(data.prix_m2) : (data.prix_m2 ?? 0),
      
      nbTotalTables: data.nbTotalTables ?? 0,
      nbTablesLibres: data.nbTablesLibres ?? 0,
      
      zonesPlan: mappedPlans 
    };

    return mapped;
  }
  
  loadZones(festivalId: number): void {
    const url = `${this.apiUrl}/${festivalId}/zones`;
    
    this.http.get<any[]>(url, { withCredentials: true })
      .subscribe({ 
        next: (data) => {
          if (!data || data.length === 0) {
            console.warn('⚠️ Aucune zone retournée par le serveur');
            this._zones.set([]);
            return;
          }
          
          const mapped = data.map(z => this.mapZone(z));
          this._zones.set(mapped);
        }, 
        error: (err) => {
          console.error('❌ Erreur lors du chargement des zones:', err);
          this._zones.set([]);
        }
      }); 
  }
}