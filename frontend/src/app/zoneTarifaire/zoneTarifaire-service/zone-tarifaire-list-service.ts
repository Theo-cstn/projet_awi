import { Injectable, signal, inject } from '@angular/core';
import { ZoneTarifaire } from '../../types/zone-tarifaire-dto';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ZoneTarifaireListService {
  private http = inject(HttpClient); 
  
  private readonly apiUrl = 'https://localhost:4000/api/zone-tarifaire/festival'; 
  private readonly _zones = signal<ZoneTarifaire[]>([]); 
  
  readonly zones = this._zones.asReadonly(); 
  
  // Mapping backend → frontend 
  private mapZone(data: any): ZoneTarifaire { 
    return { 
      id: data.id, 
      nom: data.nom, 
      prixTable: data.prix_table, 
      prixM: data.prix_m2, 
      nbTotalTables: data.nb_total_tables, 
      nbTablesLibres: data.nb_tables_libres, 
      
      zonesPlan: data.zones_plan?.map((zp: any) => ({ 
        id: zp.id, 
        nom: zp.nom, 
        nbTables: zp.nombre_tables 
      })) ?? [] 
    }; 
  }
  loadZones(festivalId: number): void { 
    this.http.get<any[]>(`${this.apiUrl}/${festivalId}`, { withCredentials: true })
    .subscribe({ next: (data) => { 
      const mapped = data.map(z => this.mapZone(z)); 
      this._zones.set(mapped); 
    }, 
    error: (err) => console.error('Erreur chargement zones tarifaires', err) 
  }); 
}
  
}
