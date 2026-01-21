import { Component, input, output } from '@angular/core';
import { ZoneTarifaire } from '../../types/zone-tarifaire-dto';
import { ZonePlanComponent } from "../../zonePlan/zonePlan-component/zone-plan-component";
import { CurrencyPipe } from '@angular/common';


@Component({
  selector: 'app-zone-tarifaire-component',
  imports: [ZonePlanComponent, CurrencyPipe],
  templateUrl: './zone-tarifaire-component.html',
  styleUrl: './zone-tarifaire-component.css',
})
export class ZoneTarifaireComponent {
  zoneT = input<ZoneTarifaire|null>(null);
  
  // Pour la gestion depuis le formulaire parent
  canEdit = input<boolean>(false);
  canDelete = input<boolean>(false);
  
  edit = output<ZoneTarifaire>();
  remove = output<number>();
  
  onEdit(): void {
    if (this.zoneT()) {
      this.edit.emit(this.zoneT()!);
    }
  }
  
  onRemove(): void {
    if (this.zoneT()?.id) {
      this.remove.emit(this.zoneT()!.id);
    }
  }
}
