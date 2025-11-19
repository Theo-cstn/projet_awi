import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FestivalListService } from '../festival-service/festival-list-service';
import { FestivalComponent } from '../festival-component/festival-component';
import { Festival } from '../../types/festival-dto';
import { FestivalForm } from '../festival-form/festival-form';

@Component({
  selector: 'app-festival-list',
  standalone: true,
  imports: [CommonModule, FestivalComponent, FestivalForm],
  templateUrl: './festival-list.html',
  styleUrl: './festival-list.css'
})

export class FestivalList {
  private festivalService = inject(FestivalListService);
  
  // Signals depuis le service (readonly)
  festivals = this.festivalService.festivals;
  loading = this.festivalService.loading;
  error = this.festivalService.error;
  
  // État local pour la sélection
  selectedFestivalId = signal<number | null>(null);
  showForm = signal<boolean>(false); // Affichage du form

  
  constructor() {
    // Charge les données au démarrage (demandé par le service -> HTTP vers le backend)
    this.festivalService.loadFestivals();
  }

  onFestivalSelected(festival: Festival) {
    console.log('Festival sélectionné:', festival);
    this.selectedFestivalId.set(festival.id);
  }

  onRetryLoad() {
    this.festivalService.loadFestivals();
  }

  onShowForm() {
    this.showForm.set(true);
  }

  onHideForm() {
    this.showForm.set(false);
  }

  async onSaveFestival(festivalData: any) {
    try {
      console.log('Création du festival:', festivalData);
      
      // Calculer le nombre total de tables libres
      const nombreTablesLibres = festivalData.zonesTarifaires.reduce(
        (total: number, zone: any) => total + zone.nombreTablesLibres,
        0
      );

      // Créer l'objet festival pour le service
      const newFestival = {
        nom: festivalData.nom,
        nombreTablesLibres,
        stock: {
          petites: festivalData.stock.petites || 0,
          grandes: festivalData.stock.grandes || 0,
          mairie: festivalData.stock.mairie || 0
        },
        zonesTarifaires: festivalData.zonesTarifaires
      };

      // Appel au service (qui fera l'appel API plus tard)
      await this.festivalService.addFestival(newFestival);
      
      this.showForm.set(false);
      console.log('Festival créé avec succès !');
      
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      // TODO: Afficher une notification d'erreur
    }
  }
}