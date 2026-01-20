import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EditeurDto } from '../../types/editeur-dto';
import { PersonneDto } from '../../types/personne-dto'; // Garde tes imports

@Injectable({
  providedIn: 'root',
})
export class EditeurListService {
  private readonly http = inject(HttpClient);
  
  private readonly apiUrl = 'https://localhost:4000/api/editeurs';
  private readonly festivalApiUrl = 'https://localhost:4000/api/festivals';
  
  private readonly _editeurs = signal<EditeurDto[]>([]);
  
  private lastID : number = 0;
  private lastContactID : number = 0;

  readonly editeurs = this._editeurs.asReadonly();


  /**
   * Charge les éditeurs (Global ou Filtré par Festival)
   */
  loadEditeurs(festivalId?: number): void {
    let url = this.apiUrl;

    if (festivalId) {
      url = `${this.festivalApiUrl}/${festivalId}/editeurs`;
    }


    this.http.get<any[]>(url, { withCredentials: true }).subscribe({
      next: (data) => {
        // Mapping Backend -> Frontend
        const editeurs: EditeurDto[] = data.map(e => ({
          id: e.id,
          nom: e.nom,
          contacts: e.contacts || []
        }));
        
        this._editeurs.set(editeurs);
        
        // Mise à jour pour ta gestion locale des IDs
        if (editeurs.length > 0) {
            this.lastID = Math.max(...editeurs.map(e => e.id || 0), 0);
        }
      },
      error: (err) => console.error('Erreur chargement éditeurs:', err)
    });
  }

  /**
   * Ajoute un éditeur (Global)
   */
  add(editeur: EditeurDto): void {
    if (editeur.id === undefined){
      editeur.id = this.lastID + 1;
      this.lastID += 1;
    }

    this.http.post<EditeurDto>(this.apiUrl, editeur, { withCredentials: true }).subscribe({
      next: (newEditeur) => {
        // On recharge ou on ajoute à la liste
        this._editeurs.update((list) => [...list, newEditeur]);
      },
      error: (err) => console.error('Erreur ajout éditeur:', err)
    });
  }

  update(partial: Partial<EditeurDto> & { id: number }): void {
    this.http.put<EditeurDto>(`${this.apiUrl}/${partial.id}`, partial, { withCredentials: true }).subscribe({
      next: (updated) => {
         this._editeurs.update((list) =>
          list.map(e => (e.id === updated.id ? updated : e))
        );
      },
      error: (err) => console.error('Erreur update éditeur:', err)
    });
  }

  findById(id: number): EditeurDto | undefined {
    return this._editeurs().find((e) => e.id === id);
  }
}