import { Injectable, inject, signal } from '@angular/core';
import { JeuDto } from '../../types/jeu-dto';
import { EditeurListService } from '../../editeur/editeur-service/editeur-list-service';

@Injectable({
  providedIn: 'root',
})
export class JeuListService {
  private readonly editeurService = inject(EditeurListService);

  
  private readonly _jeux = signal<JeuDto[]>([
    {
      id: 1,
      nom: 'jeu1',
      ageMin: 3,
      ageMax: 70,
      editeur: this.editeurService.findById(1)!,
      auteur: undefined,
      type: 'stratégie',
      taille: 'petit'
    },     
  ])

  private lastID : number = 1

  readonly jeux = this._jeux.asReadonly() // Contrat public : lecture seule

  add(jeu: JeuDto):void{
    if (jeu.id === undefined){
      jeu.id = this.lastID + 1
      this.lastID += 1
    }
    this._jeux.update((list: JeuDto[]) => [...list, jeu])
  }

  update(partial: Partial<JeuDto> & { id: number }): void {
    this._jeux.update((list: JeuDto[]) =>
      list.map(j => (j.id === partial.id ? { ...j, ...partial } : j))
    )
  }

  findById(id: number): JeuDto | undefined {
    return this._jeux().find((j: JeuDto) => j.id === id)
  }
}
