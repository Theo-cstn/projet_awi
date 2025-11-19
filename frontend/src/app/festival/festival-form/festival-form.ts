import { Component, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ZoneTarifaireForm } from '../../zoneTarifaire/zoneTarifaire-form/zone-tarifaire-form';

@Component({
  selector: 'app-festival-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ZoneTarifaireForm],
  templateUrl: './festival-form.html',
  styleUrl: './festival-form.css'
})
export class FestivalForm {
  save = output<any>();
  cancel = output<void>();

  private fb = inject(FormBuilder);
  form: FormGroup;

  showZoneForm = false; // Contrôle l'affichage du formulaire ZoneTarifaireForm

  constructor() {
    this.form = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(3)]],
      stock: this.fb.group({
        petites: [0, [Validators.required, Validators.min(0)]],
        grandes: [0, [Validators.required, Validators.min(0)]],
        mairie: [0, [Validators.required, Validators.min(0)]]
      }),
      // Initialise un FormArray vide pour les zones tarifaires du festival.
      zonesTarifaires: this.fb.array([])
    });
  }

  get zonesTarifaires() {
    return this.form.get('zonesTarifaires') as FormArray;
  }

  // Ajoute une nouvelle zone en appelant ZoneTarifaireForm
  onAddZone(zoneData: any) {
    this.zonesTarifaires.push(this.fb.group(zoneData));
    this.showZoneForm = false; // Masque le formulaire après ajout
  }

  // Annule l'ajout d'une zone
  onCancelZone() {
    this.showZoneForm = false; // Masque le formulaire sans ajouter de zone
  }

  // Supprime une zone tarifaire
  removeZone(index: number) {
    this.zonesTarifaires.removeAt(index); // Supprime la zone à l'index donné
  }

  onSubmit() {
    if (this.form.valid) {
      const formValue = this.form.value;
      this.save.emit(formValue);
      this.form.reset();
    }
  }

  onCancel() {
    this.cancel.emit();
    this.form.reset();
  }
}