import { Component, input, output, computed, signal, inject, ElementRef } from '@angular/core';
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

  zonesVisible = signal(false);

  private elementRef = inject(ElementRef);
  
  onSelect() {
    this.select.emit(this.festival());
  }

  onEdit(event: Event) {
    event.stopPropagation();
    this.edit.emit(this.festival());
  }

  toggleZones(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    // On regarde si on est sur le point de fermer
    const isClosing = this.zonesVisible();

    this.zonesVisible.update(v => !v);

    if (isClosing) {
      setTimeout(() => {
        this.elementRef.nativeElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest'
        });
      }, 0);
    }
  }

  totalStockPhysique = computed(() => {
    const f = this.festival();
    return f.nbTablesPetites + f.nbTablesGrandes + f.nbTablesMairie;
  });

  totalCommercialCapacity = computed(() => {
    return this.festival().zonesTarifaires.reduce((acc, z) => acc + (z.nbTotalTables || 0), 0);
  });

  totalCommercialRemaining = computed(() => {
    return this.festival().zonesTarifaires.reduce((acc, z) => acc + (z.nbTablesLibres || 0), 0);
  });
}