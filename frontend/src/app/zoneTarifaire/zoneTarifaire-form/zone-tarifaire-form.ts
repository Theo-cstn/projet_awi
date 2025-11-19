import { Component, signal, input, output } from '@angular/core';
import {FormControl, FormGroup } from '@angular/forms'
import { ZoneTarifaire } from '../../types/zone-tarifaire-dto';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-zone-tarifaire-form',
  imports: [ReactiveFormsModule],
  templateUrl: './zone-tarifaire-form.html',
  styleUrl: './zone-tarifaire-form.css',
})
export class ZoneTarifaireForm {
  readonly newZoneTarifaire = signal<Omit<ZoneTarifaire, 'id'>>({ nom: '', nbTotalTables: 0, prixTable: 0, prixM: 0 })

  add = output< Omit<ZoneTarifaire, 'id'> >();
  readonly form = new FormGroup({
    nom: new FormControl('', { nonNullable: true }),
    nbTotalTables: new FormControl(0),
    prixTable: new FormControl(0),
    prixM: new FormControl(0)
  })

  onSubmitForm(): void {

    const formValue = this.form.getRawValue();

    let prixM = formValue.prixM;
    if (prixM === null || prixM === undefined){
      prixM = formValue.prixTable!/4.5;
    }

    const zoneTarifaire : Omit<ZoneTarifaire, 'id'> = {
      nom: this.form.value.nom!,
      nbTotalTables: this.form.value.nbTotalTables!,
      prixTable: this.form.value.prixTable!,
      prixM: this.form.value.prixM!
    }

    this.add.emit(zoneTarifaire);

    this.form.reset({
      nom: '',
      nbTotalTables:null,
      prixTable: null,
      prixM: null
    });
  }
}
