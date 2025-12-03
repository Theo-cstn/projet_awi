import { Injectable, inject, signal } from '@angular/core';
import { JeuDto } from '../../types/jeu-dto';
import { EditeurListService } from '../../editeur/editeur-service/editeur-list-service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class JeuListService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://localhost:4000/api';

  private readonly _jeux = signal<JeuDto[]>([]);
  private lastID: number = 0;

  readonly jeux = this._jeux.asReadonly();

  constructor() {
    this.loadFromApi();
  }
  

  loadFromApi(): void {
    console.log('🔄 Chargement depuis:', `${this.apiUrl}/jeux`);
    
    // Le backend retourne un format différent, on utilise 'any' temporairement
    this.http.get<any[]>(`${this.apiUrl}/jeux`)
      .subscribe({
        next: (jeuxApi) => {
          console.log('✅ Données reçues:', jeuxApi);
          console.log('Premier jeu brut:', jeuxApi[0]);
          
          // Convertir les données du backend vers le format JeuDto
          const jeux: JeuDto[] = jeuxApi.map(j => ({
            id: j.id,
            nom: j.nom,
            typeG: j.typeg, // 👈 typeg (backend) → typeG (frontend)
            age_min: j.age_min,
            age_max: j.age_max,
            editeur_id: j.editeur_id,
            editeur: { // 👈 Créer l'objet editeur depuis nom_editeur
              id: j.editeur_id,
              nom: j.nom_editeur
            },
            auteurs: j.auteurs || []
          }));
          
          console.log('Premier jeu converti:', jeux[0]);
          
          this._jeux.set(jeux);
          const maxId = Math.max(...jeux.map(j => j.id || 0), 0);
          this.lastID = maxId;
        },
        error: (err) => {
          console.error('❌ Erreur chargement jeux:', err);
        }
      });
  }

  add(jeu: JeuDto): void {
    if (jeu.id === undefined) {
      jeu.id = this.lastID + 1;
      this.lastID += 1;
    }
    this._jeux.update((list: JeuDto[]) => [...list, jeu]);
    
    // TODO: POST vers backend
    // this.http.post<JeuDto>(`${this.apiUrl}/jeux`, jeu).subscribe(...)
  }

  update(partial: Partial<JeuDto> & { id: number }): void {
    this._jeux.update((list: JeuDto[]) =>
      list.map(j => (j.id === partial.id ? { ...j, ...partial } : j))
    );
    
    // TODO: PUT vers backend
  }

  findById(id: number): JeuDto | undefined {
    return this._jeux().find((j: JeuDto) => j.id === id);
  }
}
