import { Component, input, output } from '@angular/core';
import { ZonePlan } from '../../types/zone-plan-dto';

@Component({
  selector: 'app-zone-plan',
  imports: [],
  templateUrl: './zone-plan-component.html',
  styleUrl: './zone-plan-component.css',
})
export class ZonePlanComponent {
  zonePlan = input<ZonePlan|null>(null);
  
  // Pour la gestion depuis le formulaire parent
  canEdit = input<boolean>(false);
  canDelete = input<boolean>(false);
  
  edit = output<ZonePlan>();
  remove = output<ZonePlan>();
  
  onEdit(): void {
    if (this.zonePlan()) {
      this.edit.emit(this.zonePlan()!);
    }
  }
  
  onRemove(): void {
    if (this.zonePlan()) {
      this.remove.emit(this.zonePlan()!);
    }
  }
}
