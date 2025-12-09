import { Component, signal, computed, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Festival } from "../../types/festival-dto";
import { FestivalComponent } from "../festival-component/festival-component";
import { FestivalForm } from "../festival-form/festival-form";
import { FestivalListService } from "../festival-service/festival-list-service";
import { RouterLink } from "@angular/router";


@Component({
  selector: 'app-festival-list',
  standalone: true,
  imports: [CommonModule, FestivalComponent, FestivalForm, RouterLink],
  templateUrl: './festival-list.html',
  styleUrl: './festival-list.css'
})

export class FestivalList {
  readonly svc = inject(FestivalListService);
  readonly festivals = this.svc.festivals;
  showForm: boolean = false;
  selectedFestival = signal<Festival|null>(null);

  add(){
    this.showForm=true;
  }

  onAdd(newFestival: Omit<Festival, 'id'>){
    if (!newFestival.nom || !newFestival.date_debut || !newFestival.date_fin || newFestival.zonesTarifaires.length === 0){
      return;
    }
    this.svc.onAdd(newFestival);
    this.showForm=false;
    this.selectedFestival.set(null);

    //verification :
    console.log(`onAdd festival : ${JSON.stringify(newFestival)}`);
  }

  onRemove(idFestival: number){
    if (confirm('Etes vous sur de vouloir supprimer ce festival ?')) {
      this.svc.onRemove(idFestival);
    }
  }

  removeAll(){
    if (confirm('Etes vous sur de vouloir supprimer tous les festivals ?')) {
      this.festivals().forEach(f => {
        this.svc.onRemove(f.id!);
      });
    }
  }

  nbFestival = computed (() => {
    return this.festivals.length;
  } )

  totalTables = computed (() => {
    return this.festivals().reduce((sum, f) => sum + f.nbTotalTables, 0);
  })
}