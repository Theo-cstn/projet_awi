import { Injectable, signal } from '@angular/core'
import { Festival } from '../../types/festival-dto';
import { FestivalList } from '../festival-list/festival-list';

@Injectable({ providedIn: 'root' })
export class FestivalListService {
  showForm: boolean = false;
  lastId: number = 2;

  private readonly _festivals = signal<Festival[]>([
    {id: 0, nom: 'Festival du Printemps', date: new Date(2025, 4, 15), nbTablesPetites: 10, nbTablesGrandes: 5, nbTablesMairie: 3, nbTotalTables: 18, 
      zonesTarifaires: [
        { id: 0, nom: 'Zone A', nbTotalTables: 10, prixTable: 50, prixM: 11.11, 
          zonesPlan: [
            { id: 0, nom: 'zone plan1', nbTables: 0}
          ] },
        { id: 1, nom: 'Zone B', nbTotalTables: 8, prixTable: 30, prixM: 6.67,
          zonesPlan: [
            { id: 0, nom: 'zone plan1', nbTables: 0},
            { id: 1, nom: 'zone plan2', nbTables: 2}
          ]
        }
      ]
    },
    {id: 1, nom: 'Festival d\'Été', date: new Date(2025, 6, 20), nbTablesPetites: 15, nbTablesGrandes: 8, nbTablesMairie: 2, nbTotalTables: 25,
      zonesTarifaires: [
        { id: 2, nom: 'Zone Principale', nbTotalTables: 20, prixTable: 60, prixM: 13.33, 
          zonesPlan: [
            { id: 0, nom: 'zone plan1', nbTables: 0}
          ]
        }
      ]
    }
  ]);

  readonly festivals = this._festivals.asReadonly();

  onRemove(idFestival: number){
    this._festivals.update(festivalList =>
      festivalList.filter(festival => festival.id !== idFestival)
    );
  }

  findById(id: number): Festival|undefined {
    return this._festivals().find(f => f.id = id);
  }

  onAdd(newFestival: Omit<Festival, 'id'>) {
    this._festivals.update(festivalList => [
      ...festivalList, {...newFestival, id: this.lastId}
    ]);
    this.showForm = false;
    this.lastId = this.lastId + 1;
  }

  update(partial: Partial<Festival> & {id: number}) {
    this._festivals.update(festivalList =>
      festivalList.map(f => (f.id === partial.id ? {...f, ...partial}: f))
    )
  }

  removeAll(){
    this._festivals.set([])
  }
}