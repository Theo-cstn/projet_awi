import { Injectable, signal } from '@angular/core';
import { EditeurDto } from '../../types/editeur-dto';
import { PersonneDto } from '../../types/personne-dto';

@Injectable({
  providedIn: 'root',
})
export class EditeurListService {
  private readonly _editeurs = signal<EditeurDto[]>([
    {
      id: 1,
      nom: 'editeur1',
      contacts: [
        {
          id: 1,
          nom: 'Cantillon',
          prenom: 'Tom',
          fonction: 'président',
          mail: 'tom@mail.com'
        },
        {
          id: 2,
          nom: 'Cantillon',
          prenom: 'Tomzer',
          fonction: 'employé',
          mail: 'tomzer@mail.com'
        }
      ],
      jeux: []
    },
  ]);

  private lastID: number = 1;
  private lastContactID: number = 2;

  readonly editeurs = this._editeurs.asReadonly();

  add(editeur: EditeurDto): void {
    if (editeur.id === undefined) {
      editeur.id = this.lastID + 1;
      this.lastID += 1;
    }
    if (!editeur.contacts) {
      editeur.contacts = [];
    }
    if (!editeur.jeux) {
      editeur.jeux = [];
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