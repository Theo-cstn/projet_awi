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
    console.log('📦 Zone brute du backend:', {
      id: data.id,
      nom: data.nom,
      nb_total_tables: data.nb_total_tables,
      nb_tables_reservees: data.nb_tables_reservees,
      nb_tables_libres: data.nb_tables_libres,
      prix_table: data.prix_table,
      prix_m2: data.prix_m2
    });

    // Gère les deux formats possibles du backend (snake_case ou camelCase)
    const nbTablesLibres = data.nb_tables_libres ?? data.nbTablesLibres ?? 
                           (data.nbTotalTables ? data.nbTotalTables - (data.nbTablesReservees ?? 0) : 
                            (data.nb_total_tables ? data.nb_total_tables - (data.nb_tables_reservees ?? 0) : 0));

    const mapped = {
      id: data.id, 
      nom: data.nom, 
      prixTable: data.prix_table ?? data.prixTable,
      prixM: data.prix_m2 ?? data.prixM,
      nbTotalTables: data.nb_total_tables ?? data.nbTotalTables ?? 0,
      nbTablesLibres,  // ✅ Utilise la valeur calculée
      zonesPlan: data.zones_plan ?? data.zonesPlan ?? [] 
    };

    console.log('✅ Zone mappée:', mapped);
    return mapped;
  }
  
  loadZones(festivalId: number): void {
    console.log(`🔄 Chargement des zones pour le festival ${festivalId}...`);
    
    const url = `${this.apiUrl}/${festivalId}`;
    console.log(`📡 URL appelée: ${url}`);
    
    this.http.get<any[]>(url, { withCredentials: true })
      .subscribe({ 
        next: (data) => {
          console.log('📥 Réponse brute du serveur:', data);
          
          if (!data || data.length === 0) {
            console.warn('⚠️ Aucune zone retournée par le serveur');
            this._zones.set([]);
            return;
          }
          
          const mapped = data.map(z => this.mapZone(z));
          console.log('🎯 Zones mappées finales:', mapped);
          
          this._zones.set(mapped);
        }, 
        error: (err) => {
          console.error('❌ Erreur lors du chargement des zones:', err);
          this._zones.set([]);
        }
      }); 
  }

  // Utile pour déboguer : affiche l'état actuel des zones
  debugZones(): void {
    console.log('🐛 État actuel des zones:', this.zones());
  }
}