import { Component, input } from '@angular/core';
import { ZonePlan } from '../../types/zone-plan-dto';

@Component({
  selector: 'app-zone-plan-component',
  imports: [],
  templateUrl: './zone-plan-component.html',
  styleUrl: './zone-plan-component.css',
})
export class ZonePlanComponent {
  zoneP = input<ZonePlan|null>(null);
}
