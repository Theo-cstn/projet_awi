import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Festival } from '../../types/festival-dto';

@Injectable({
  providedIn: 'root'
})
export class FestivalListService {
  private http = inject(HttpClient);
  
  private _festivals = signal<Festival[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  // Flag pour basculer entre mock et API
  private USE_MOCK = true; // À mettre à false pour utiliser l'API réelle
  
  // Signals publics (readonly)
  festivals = this._festivals.asReadonly();
  loading = this._loading.asReadonly();
  error = this._error.asReadonly();
  
  async loadFestivals() {

    if (this.USE_MOCK) {
      this.loadMockData();
      return;
    }


    // Code API (pour plus tard)

    this._loading.set(true);
    this._error.set(null);
    
    // Appel HTTP pour récupérer les festivals avec Observable pattern (rxjs)
    try {
      const festivals = await firstValueFrom(
        this.http.get<Festival[]>('/api/festivals')
      );
      
      this._festivals.set(festivals || []);
    } catch (error) {
      console.error('Erreur lors du chargement des festivals:', error);
      this._error.set('Impossible de charger les festivals');
      this._festivals.set([]);
    } finally {
      this._loading.set(false);
    }
  }

  async addFestival(festivalData: Omit<Festival, 'id' | 'createdAt'>) {

    if (this.USE_MOCK) {
      this.addMockFestival(festivalData);
      return;
    }

    /*
    this._loading.set(true);
    this._error.set(null);
    
    try {
      const newFestival = await firstValueFrom(
        this.http.post<Festival>('/api/festivals', festivalData)
      );
      
      // Mise à jour réactive
      this._festivals.update(festivals => [...festivals, newFestival]);
      
      return newFestival;
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      this._error.set('Impossible de créer le festival');
      throw error;
    } finally {
      this._loading.set(false);
    } */
  }

  private addMockFestival(festivalData: any) {
    const newFestival: Festival = {
      id: Date.now(), // Mock ID
      nom: festivalData.nom,
      nombreTablesLibres: festivalData.nombreTablesLibres,
      createdAt: new Date()
    };

    this._festivals.update(festivals => [newFestival, ...festivals]);
    console.log('✅ Festival mock ajouté:', newFestival);
  }


  private loadMockData() {
    console.log('🎲 Chargement des données mock...');
    
    // Simule un petit délai
    this._loading.set(true);
    
    setTimeout(() => {
      const mockFestivals: Festival[] = [
        {
          id: 1,
          nom: 'Festival Jeux Bordeaux 2024',
          nombreTablesLibres: 25,
          createdAt: new Date('2024-01-15')
        },
        {
          id: 2,
          nom: 'GameCon Paris',
          nombreTablesLibres: 42,
          createdAt: new Date('2024-02-10')
        },
        {
          id: 3,
          nom: 'Festival du Jeu Lyon',
          nombreTablesLibres: 8,
          createdAt: new Date('2024-03-05')
        }
      ];
      
      this._festivals.set(mockFestivals);
      this._loading.set(false);
      console.log('✅ Mock data chargé:', mockFestivals);
    }, 500);
  }
}