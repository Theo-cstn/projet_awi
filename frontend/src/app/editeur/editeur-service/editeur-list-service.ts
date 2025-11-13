import { Injectable, signal } from '@angular/core';
import { PersonneDto } from '../../types/personne-dto';
import { EditeurDto } from '../../types/editeur-dto';

@Injectable({
  providedIn: 'root',
})
export class EditeurListService {
  private readonly _editeurs = signal<EditeurDto[]>([
    { 
      id: 1,
      nom: 'editeur1',
      contacts : [ {id: 1,
                    nom: 'contact1',
                    prenom: 'Tom',
                    fonction: 'président',
                    mail: 'tom@mail.com',}
                  ]
    },    
  ])

  private lastID : number = 1

  readonly editeurs = this._editeurs.asReadonly() // Contrat public : lecture seule

  add(editeur: EditeurDto):void{
    if (editeur.id === undefined){
      editeur.id = this.lastID + 1
      this.lastID += 1
    }
    this._editeurs.update((list: EditeurDto[]) => [...list, editeur])
  }

  update(partial: Partial<EditeurDto> & { id: number }): void {
    this._editeurs.update((list: EditeurDto[]) =>
      list.map(e => (e.id === partial.id ? { ...e, ...partial } : e))
    )
  }

  findById(id: number): EditeurDto | undefined {
    return this._editeurs().find((e: EditeurDto) => e.id === id)
  }
}
