import { Component, input } from '@angular/core';
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
}
