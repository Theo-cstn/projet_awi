import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { JeuDto } from '../../types/jeu-dto';

@Injectable({
  providedIn: 'root',
})
export class JeuListService {
  private readonly http = inject(HttpClient);
  
  // URLs de l'API
  private readonly apiUrl = 'https://localhost:4000/api/jeux'; 
  private readonly festivalApiUrl = 'https://localhost:4000/api/festivals';

  // Signal pour stocker les jeux
  private readonly _jeux = signal<JeuDto[]>([]); 
  readonly jeux = this._jeux.asReadonly();


  /**
   * Charge les jeux.
   * - Si festivalId est fourni : charge les jeux de ce festival.
   * - Sinon : charge tous les jeux (Global).
   */

  loadJeux(festivalId?: number): void {
    let url = this.apiUrl; // Par défaut : Global (/api/jeux)

    if (festivalId) {
      // Si ID fourni : Filtré (/api/festivals/:id/jeux)
      url = `${this.festivalApiUrl}/${festivalId}/jeux`;
    }


    this.http.get<any[]>(url, { withCredentials: true }).subscribe({
      next: (data) => {
        // Mapping des données (Backend -> Frontend DTO)
        const jeux: JeuDto[] = data.map(jeu => ({
          id: jeu.id,
          nom: jeu.nom,
          typeG: jeu.typeg,
          age_min: jeu.age_min,
          age_max: jeu.age_max,
          editeur_id: jeu.editeur_id,
          editeur: jeu.editeur ? {
            id: jeu.editeur.id,
            nom: jeu.editeur.nom,
          } : undefined,
          auteurs: jeu.auteurs ? jeu.auteurs.map((auteur: any) => ({
            id: auteur.id,
            nom: auteur.nom,
            prenom: auteur.prenom,
          })) : [],
        }));
        this._jeux.set(jeux);
      },
      error: (err) => console.error('❌ Erreur chargement jeux', err)
    });
  }

  /**
   * Ajoute un nouveau jeu (Global).
   */
  add(jeu: JeuDto): void {
    this.http.post<JeuDto>(this.apiUrl, jeu, { withCredentials: true }).subscribe({
      next: (newJeu) => {
        this._jeux.update((list) => [...list, newJeu]);
      },
      error: (err) => console.error('Erreur ajout jeu:', err),
    });
  }

  /**
   * Met à jour un jeu existant.
   */
  update(jeu: Partial<JeuDto> & { id: number }): void {
    this.http.put<any>(`${this.apiUrl}/${jeu.id}`, jeu, { withCredentials: true }).subscribe({
      next: (data) => {
        console.log('✅ Jeu mis à jour (réponse backend):', data);
        
        const updatedJeu: JeuDto = {
          id: data.id,
          nom: data.nom,
          typeG: data.typeg,
          age_min: data.age_min,
          age_max: data.age_max,
          editeur_id: data.editeur_id,
          editeur: {
            id: data.editeur_id,
            nom: data.nom_editeur,
          },
          auteurs: data.auteurs?.map((auteur: any) => ({
            id: auteur.id,
            nom: auteur.nom,
            prenom: auteur.prenom,
          })) || [],
        };
        
        this._jeux.update((list) =>
          list.map((j) => (j.id === updatedJeu.id ? updatedJeu : j))
        );
      },
      error: (err) => console.error('Erreur mise à jour jeu:', err),
    });
  }

  /**
   * Supprime un jeu par son ID.
   */
  delete(id: number): void {
    this.http.delete(`${this.apiUrl}/${id}`, { withCredentials: true }).subscribe({
      next: () => {
        this._jeux.update((list) => list.filter((j) => j.id !== id));
      },
      error: (err) => console.error('Erreur suppression jeu:', err),
    });
  }
}