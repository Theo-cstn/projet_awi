import { Component, input } from '@angular/core';
import { ZoneTarifaire } from '../../types/zone-tarifaire-dto';

@Component({
  selector: 'app-zone-tarifaire-component',
  imports: [],
  templateUrl: './zone-tarifaire-component.html',
  styleUrl: './zone-tarifaire-component.css',
})
export class ZoneTarifaireComponent {
  zoneT = input<ZoneTarifaire|null>(null);
}
