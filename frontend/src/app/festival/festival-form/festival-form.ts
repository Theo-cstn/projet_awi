import { Component, signal, output, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { FormControl, FormGroup } from "@angular/forms";

import { Festival } from "../../types/festival-dto";
import { ZoneTarifaire } from "../../types/zone-tarifaire-dto";
import { ZoneTarifaireForm } from "../../zoneTarifaire/zoneTarifaire-form/zone-tarifaire-form";


@Component({
  selector: 'app-festival-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ZoneTarifaireForm],
  templateUrl: './festival-form.html',
  styleUrl: './festival-form.css'
})

export class FestivalForm {
  add = output<Omit<Festival, 'id'>>();
  zonesTarifaires = signal<ZoneTarifaire[]>([]);
  nextZoneId = signal<number>(0);

  readonly form = new FormGroup({
    nom: new FormControl('', { nonNullable: true }),
    date_debut: new FormControl('', { nonNullable: true }),
    date_fin: new FormControl('', { nonNullable: true }),
    nbTablesPetites: new FormControl(0, { nonNullable: true }),
    nbTablesGrandes: new FormControl(0, { nonNullable: true }),
    nbTablesMairie: new FormControl(0, { nonNullable: true })
  })

  nbTotalTables = computed(() => {
    const formValue = this.form.getRawValue();
    return formValue.nbTablesGrandes + formValue.nbTablesMairie + formValue.nbTablesPetites ;
  })

  onSubmitForm(): void {

    const formValue = this.form.getRawValue();

    if (this.form.valid){
      const festival: Omit<Festival, 'id'> = {
        nom: formValue.nom,
        date_debut: new Date(formValue.date_debut),
        date_fin: new Date(formValue.date_fin),
        nbTablesPetites: formValue.nbTablesPetites,
        nbTablesGrandes: formValue.nbTablesGrandes,
        nbTablesMairie: formValue.nbTablesMairie,
        nbTotalTables: this.nbTotalTables(),
        zonesTarifaires: this.zonesTarifaires()
      };
      
      this.add.emit(festival);
      
      this.form.reset({
        nom: '', 
        date_debut: '',
        date_fin: '',
        nbTablesPetites: undefined, 
        nbTablesGrandes: undefined, 
        nbTablesMairie: undefined
      });
      this.zonesTarifaires.set([]);
      this.nextZoneId.set(0);
    }
  }

  onAddZone(newZone: Omit<ZoneTarifaire, 'id'>): void {
    const zoneWithId: ZoneTarifaire={...newZone, id: this.nextZoneId()
    };
    this.zonesTarifaires.update(zones => [...zones, zoneWithId]);
    this.nextZoneId.update(id => id+1);
  }

  onRemoveZone(idZone: number): void{
    this.zonesTarifaires.update(zones =>
      zones.filter(zone => zone.id !== idZone)
    );
  }
}