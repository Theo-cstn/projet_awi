import { Component, signal, output, computed } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms'
import { ReactiveFormsModule } from '@angular/forms';

import { ZoneTarifaire } from '../../types/zone-tarifaire-dto';
import { ZonePlan } from '../../types/zone-plan-dto';
import { ZonePlanForm } from '../../zonePlan/zonePlan-form/zone-plan-form';


@Component({
  selector: 'app-zone-tarifaire-form',
  imports: [ReactiveFormsModule, ZonePlanForm],
  templateUrl: './zone-tarifaire-form.html',
  styleUrl: './zone-tarifaire-form.css',
})
export class ZoneTarifaireForm {
    add = output< Omit<ZoneTarifaire, 'id'> >();
    zonesPlan = signal<ZonePlan[]>([]);
    nextZoneId = signal<number>(0);

  //readonly newZoneTarifaire = signal<Omit<ZoneTarifaire, 'id'>>({ nom: '', nbTotalTables: 0, prixTable: 0, prixM: 0 })

  readonly form = new FormGroup({
    nom: new FormControl('', { nonNullable: true }),
    prixTable: new FormControl(0),
    prixM: new FormControl(0)
  })

  nbTotalTables = computed(() => {
    return this.zonesPlan().reduce((total, zone) => total + zone.nbTables, 0);
  })

  onSubmitForm(): void {

    const formValue = this.form.getRawValue();

    let prixM = formValue.prixM;
    if (prixM === null || prixM === undefined){
      prixM = formValue.prixTable!/4.5;
    }

    const zoneTarifaire : Omit<ZoneTarifaire, 'id'> = {
      nom: this.form.value.nom!,
      nbTotalTables: this.nbTotalTables(),
      prixTable: this.form.value.prixTable!,
      prixM: this.form.value.prixM!,
      zonesPlan: this.zonesPlan()
    }

    this.add.emit(zoneTarifaire);

    this.form.reset({
      nom: '',
      prixTable: null,
      prixM: null,
    });
    this.zonesPlan.set([]);
    this.nextZoneId.set(0);
  }

  onAddZone(newZone: Omit<ZonePlan, 'id'>): void {
    const zoneWithId: ZonePlan={...newZone, id: this.nextZoneId()};
    this.zonesPlan.update(zones => [...zones, zoneWithId]);
    this.nextZoneId.update(id => id+1);
  }

  onRemoveZone(idZone: number): void{
    this.zonesPlan.update(zones =>
      zones.filter(zone => zone.id !== idZone)
    );
  }
}
