import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Festival } from '../../types/festival-dto';
import { ZoneTarifaireComponent } from "../../zoneTarifaire/zoneTarifaire-component/zone-tarifaire-component";

@Component({
  selector: 'app-festival-component',
  standalone: true,
  imports: [CommonModule, ZoneTarifaireComponent],
  templateUrl: './festival-component.html',
  styleUrl: './festival-component.css'
})
export class FestivalComponent {
  // récuprer les infos d'un festival pour les afficher
  festival = input.required<Festival>();
  remove = output<number>();
  isSelected = input<boolean>(false);
  
  select = output<Festival>();

  // Pour l'édition
  canEdit = input<boolean>(false);
  edit = output<Festival>();

  onSelect() {
    this.select.emit(this.festival());
  }

  onEdit(event: Event) {
    event.stopPropagation(); // Empêche le clic de remonter à la carte parente
    this.edit.emit(this.festival());
  }
}