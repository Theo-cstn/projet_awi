import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { JeuDto } from '../../types/jeu-dto';

@Injectable({
  providedIn: 'root',
})
export class JeuListService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://localhost:4000/api'; // URL de l'API backend

  private readonly _jeux = signal<JeuDto[]>([]); // Signal pour stocker les jeux
  readonly jeux = this._jeux.asReadonly(); // Signal en lecture seule

  constructor() {
    this.loadFromApi();
  }

  /**
   * Charge les jeux depuis l'API backend.
   */
  loadFromApi(): void {
    this.http.get<any[]>(`${this.apiUrl}/jeux`).subscribe({
      next: (data) => {
        const jeux: JeuDto[] = data.map(jeu => ({
          id: jeu.id,
          nom: jeu.nom,
          typeG: jeu.typeg,
          age_min: jeu.age_min,
          age_max: jeu.age_max,
          editeur_id: jeu.editeur_id,
          editeur: {
            id: jeu.editeur_id,
            nom: jeu.nom_editeur,
          },
          auteurs: jeu.auteurs.map((auteur: any) => ({
            id: auteur.id,
            nom: auteur.nom,
            prenom: auteur.prenom,
          })),
        }));
        this._jeux.set(jeux);
      },
      error: (err) => console.error('Erreur chargement jeux:', err),
    });
  }

  /**
   * Ajoute un nouveau jeu.
   */
  add(jeu: JeuDto): void {
    this.http.post<JeuDto>(`${this.apiUrl}/jeux`, jeu).subscribe({
      next: (newJeu) => {
        console.log('✅ Jeu ajouté:', newJeu);
        this._jeux.update((list) => [...list, newJeu]);
      },
      error: (err) => {
        console.error('❌ Erreur ajout jeu:', err);
      },
    });
  }

  /**
   * Met à jour un jeu existant.
   */
  update(jeu: Partial<JeuDto> & { id: number }): void {
    this.http.put<JeuDto>(`${this.apiUrl}/jeux/${jeu.id}`, jeu).subscribe({
      next: (updatedJeu) => {
        console.log('✅ Jeu mis à jour:', updatedJeu);
        this._jeux.update((list) =>
          list.map((j) => (j.id === updatedJeu.id ? updatedJeu : j))
        );
      },
      error: (err) => {
        console.error('❌ Erreur mise à jour jeu:', err);
      },
    });
  }

  /**
   * Supprime un jeu par son ID.
   */
  delete(id: number): void {
    this.http.delete(`${this.apiUrl}/jeux/${id}`).subscribe({
      next: () => {
        console.log('✅ Jeu supprimé, ID:', id);
        this._jeux.update((list) => list.filter((j) => j.id !== id));
      },
      error: (err) => {
        console.error('❌ Erreur suppression jeu:', err);
      },
    });
  }
}