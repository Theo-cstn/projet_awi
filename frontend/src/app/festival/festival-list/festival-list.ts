import { Component, signal, computed, inject, OnInit } from "@angular/core";
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
export class FestivalList implements OnInit {
  readonly svc = inject(FestivalListService);
  readonly festivals = this.svc.festivals;
  showForm: boolean = false;
  selectedFestival = signal<Festival | null>(null);

  ngOnInit(): void {
    // Charger les festivals depuis le backend au démarrage du composant
    this.svc.loadFestivals();
  }

  add() {
    this.showForm = true;
  }

  onAdd(newFestival: Omit<Festival, 'id'>) {
    if (!newFestival.nom || !newFestival.date_debut || !newFestival.date_fin || newFestival.zonesTarifaires.length === 0) {
      return;
    }
    this.svc.onAdd(newFestival);
    this.showForm = false;
    this.selectedFestival.set(null);

    // Vérification :
    console.log(`onAdd festival : ${JSON.stringify(newFestival)}`);
  }

  onRemove(idFestival: number) {
    if (confirm('Etes-vous sûr de vouloir supprimer ce festival ?')) {
      this.svc.onRemove(idFestival);
    }
  }

  removeAll() {
    if (confirm('Etes-vous sûr de vouloir supprimer tous les festivals ?')) {
      this.festivals().forEach(f => {
        this.svc.onRemove(f.id!);
      });
    }
  }

  nbFestival = computed(() => {
    return this.festivals.length;
  });

  totalTables = computed(() => {
    return this.festivals().reduce((sum, f) => sum + f.nbTotalTables, 0);
  });
}