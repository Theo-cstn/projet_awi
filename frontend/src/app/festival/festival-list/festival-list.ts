import { Component, signal, computed, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Festival } from "../../types/festival-dto";
import { FestivalComponent } from "../festival-component/festival-component";
import { FestivalForm } from "../festival-form/festival-form";
import { FestivalListService } from "../festival-service/festival-list-service";
import { RouterLink, Router } from "@angular/router";

@Component({
  selector: 'app-festival-list',
  standalone: true,
  imports: [CommonModule, FestivalComponent, FestivalForm, RouterLink],
  templateUrl: './festival-list.html',
  styleUrl: './festival-list.css'
})
export class FestivalList implements OnInit {
  readonly svc = inject(FestivalListService);
  private router = inject(Router);

  readonly festivals = this.svc.festivals;
  showForm: boolean = false;
  selectedFestival = signal<Festival | null>(null);

  ngOnInit(): void {
    // Charger les festivals depuis le backend au démarrage du composant
    this.svc.loadFestivals();
  }

  // --- NAVIGATION ---
  
  // Méthode appelée lors du clic sur une carte
  openWorkspace(id: number | undefined) {
  if (id) {
    this.router.navigate(['/festivals', id]);
  } else {
    console.error('Impossible d\'ouvrir le workspace : ID manquant');
  }
}

  //Méthode pour gérer le clic sur le bouton d'édition
  handleEdit(event: MouseEvent, festival: Festival) {
    event.stopPropagation(); // Empêche le clic de monter vers la carte
    console.log('Edition demandée pour', festival.nom);
  }

  // --- LOGIQUE EXISTANTE ---

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

    console.log(`onAdd festival : ${JSON.stringify(newFestival)}`);
  }

  nbFestival = computed(() => {
    return this.festivals().length;
  });

  totalTables = computed(() => {
    return this.festivals().reduce((sum, f) => sum + f.nbTotalTables, 0);
  });
}