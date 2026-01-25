import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators'; // 👈 Ne pas oublier cet import
import { EditeurDto } from '../../types/editeur-dto';
import { PersonneDto } from '../../types/personne-dto';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EditeurListService {
  private readonly http = inject(HttpClient);
  
  private readonly apiUrl = `${environment.apiUrl}/editeurs`;
  private readonly festivalApiUrl = `${environment.apiUrl}/festivals`;
  
  private readonly _editeurs = signal<EditeurDto[]>([]);
  readonly editeurs = this._editeurs.asReadonly();
  
  private lastID : number = 0;

  loadEditeurs(festivalId?: number): void {
    let url = this.apiUrl;
    if (festivalId) {
      url = `${this.festivalApiUrl}/${festivalId}/editeurs`;
    }

    this.http.get<any[]>(url, { withCredentials: true }).subscribe({
      next: (data) => {
        const editeurs: EditeurDto[] = data.map(e => ({
          id: e.id,
          nom: e.nom,
          contacts: e.contacts || []
        }));
        this._editeurs.set(editeurs);
        if (editeurs.length > 0) {
            this.lastID = Math.max(...editeurs.map(e => e.id || 0), 0);
        }
      },
      error: (err) => console.error('Erreur chargement éditeurs:', err)
    });
  }

  add(editeur: EditeurDto): void {
    if (editeur.id === undefined){
      editeur.id = this.lastID + 1;
      this.lastID += 1;
    }
    this.http.post<EditeurDto>(this.apiUrl, editeur, { withCredentials: true }).subscribe({
      next: (newEditeur) => {
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

  
  addContact(editeurId: number, contact: PersonneDto) {
    const payload = {
      nom: contact.nom,
      prenom: contact.prenom,
      email: contact.email,
      fonction: contact.poste || '', 
      est_contact_principal: false
    };

    return this.http.post<void>(`${this.apiUrl}/${editeurId}/contacts`, payload, { withCredentials: true })
      .pipe(tap(() => this.loadEditeurs()));
  }

  updateContact(editeurId: number, contact: PersonneDto) {
    const payload = {
      nom: contact.nom,
      prenom: contact.prenom,
      email: contact.email,
      fonction: contact.poste || '',
      est_contact_principal: false
    };

    return this.http.put<void>(`${this.apiUrl}/${editeurId}/contacts/${contact.id}`, payload, { withCredentials: true })
      .pipe(tap(() => this.loadEditeurs()));
  }

  deleteContact(editeurId: number, contactId: number) {
    return this.http.delete<void>(`${this.apiUrl}/${editeurId}/contacts/${contactId}`, { withCredentials: true })
      .pipe(tap(() => this.loadEditeurs()));
  }
}