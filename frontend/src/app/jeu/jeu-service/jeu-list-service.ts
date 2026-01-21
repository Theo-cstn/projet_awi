import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { JeuDto } from '../../types/jeu-dto';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class JeuListService {
  private readonly http = inject(HttpClient);
  
  // URLs de l'API
  private readonly apiUrl = `${environment.apiUrl}/jeux`;
  private readonly festivalApiUrl = `${environment.apiUrl}/festivals`;
  private readonly editeurApiUrl = `${environment.apiUrl}/editeurs`;

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
          } : (jeu.nom_editeur ? {
            id: jeu.editeur_id,
            nom: jeu.nom_editeur,
          } : undefined),
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
   * Charge les jeux d'un éditeur spécifique.
   */
  loadJeuxByEditeur(editeurId: number): void {
    const url = `${this.editeurApiUrl}/${editeurId}/jeux`;

    this.http.get<any[]>(url, { withCredentials: true }).subscribe({
      next: (data) => {
        console.log(`📥 Données brutes reçues pour éditeur ${editeurId}:`, data);
        
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
        console.log(`✅ Jeux de l'éditeur ${editeurId} chargés et mappés:`, jeux);
        this._jeux.set(jeux);
      },
      error: (err) =>  {
        console.error('❌ Erreur chargement jeux éditeur', err);
        this.loadJeux();
      }
    });
  }

  /**
   * Ajoute un nouveau jeu (Global).
   */
  add(jeu: JeuDto): void {
    this.http.post<any>(this.apiUrl, jeu, { withCredentials: true }).subscribe({
      next: (data) => {
        // Mapper la réponse du backend
        const newJeu: JeuDto = {
          id: data.id,
          nom: data.nom,
          typeG: data.typeG,
          age_min: data.age_min,
          age_max: data.age_max,
          editeur_id: data.editeur_id,
          editeur: data.nom_editeur ? {
            id: data.editeur_id,
            nom: data.nom_editeur,
          } : undefined,
          auteurs: data.auteurs?.map((auteur: any) => ({
            id: auteur.id,
            nom: auteur.nom,
            prenom: auteur.prenom,
          })) || [],
        };
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