import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EditeurDto } from '../../types/editeur-dto';
import { PersonneDto } from '../../types/personne-dto';

@Injectable({
  providedIn: 'root',
})
export class EditeurListService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://localhost:4000/api';
  
  private readonly _editeurs = signal<EditeurDto[]>([]);
  private lastID : number = 0
  private lastContactID : number = 0

  readonly editeurs = this._editeurs.asReadonly();

  constructor() {
    this.loadFromApi();
  }

  loadFromApi(): void {
    console.log('🔄 Chargement des éditeurs depuis:', `${this.apiUrl}/editeurs`);
    
    this.http.get<any[]>(`${this.apiUrl}/editeurs`)
      .subscribe({
        next: (editeursApi) => {
          console.log('✅ Éditeurs reçus:', editeursApi);
          
          // Convertir les données du backend vers le format EditeurDto
          const editeurs: EditeurDto[] = editeursApi.map(e => ({
            id: e.id,
            nom: e.nom,
            contacts: e.contacts || []
          }));
          
          console.log('Premier éditeur converti:', editeurs[0]);
          
          this._editeurs.set(editeurs);
          const maxId = Math.max(...editeurs.map(e => e.id || 0), 0);
          this.lastID = maxId;
        },
        error: (err) => {
          console.error('❌ Erreur chargement éditeurs:', err);
        }
      });
  }

  add(editeur: EditeurDto):void{
    if (editeur.id === undefined){
      editeur.id = this.lastID + 1
      this.lastID += 1
    }
    this._editeurs.update((list: EditeurDto[]) => [...list, editeur]);
  }

  update(partial: Partial<EditeurDto> & { id: number }): void {
    this._editeurs.update((list: EditeurDto[]) =>
      list.map(e => (e.id === partial.id ? { ...e, ...partial } : e))
    );
  }

  findById(id: number): EditeurDto | undefined {
    return this._editeurs().find((e: EditeurDto) => e.id === id);
  }

  addContact(editeurId: number, contact: PersonneDto): void {
    if (contact.id === undefined) {
      contact.id = this.lastContactID + 1;
      this.lastContactID += 1;
    }
    
    this._editeurs.update((list: EditeurDto[]) =>
      list.map(e => {
        if (e.id === editeurId) {
          return {
            ...e,
            contacts: [...(e.contacts || []), contact]
          };
        }
        return e;
      })
    );
  }

  deleteContact(editeurId: number, contactId: number): void {
    this._editeurs.update((list: EditeurDto[]) =>
      list.map(e => {
        if (e.id === editeurId) {
          return {
            ...e,
            contacts: (e.contacts || []).filter(c => c.id !== contactId)
          };
        }
        return e;
      })
    );
  }
}