import { Component, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-festival-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './festival-form.html',
  styleUrl: './festival-form.css'
})
export class FestivalForm {
  save = output<any>();
  cancel = output<void>();

  private fb = inject(FormBuilder);
  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(3)]],
      zonesTarifaires: this.fb.array([this.createZoneGroup()])
    });
  }

  get zonesTarifaires() {
    return this.form.get('zonesTarifaires') as FormArray;
  }

  private createZoneGroup() {
    return this.fb.group({
      nom: ['', Validators.required],
      nombreTablesTotal: [1, [Validators.required, Validators.min(1)]],
      prixTable: [0, [Validators.required, Validators.min(0)]],
      prixM2: [0, Validators.min(0)]
    });
  }

  addZone() {
    this.zonesTarifaires.push(this.createZoneGroup());
  }

  removeZone(index: number) {
    if (this.zonesTarifaires.length > 1) {
      this.zonesTarifaires.removeAt(index);
    }
  }

  onSubmit() {
    if (this.form.valid) {
      const formValue = this.form.value;
      
      // Auto-calcul du prix m² si non renseigné
      formValue.zonesTarifaires = formValue.zonesTarifaires.map((zone: any) => ({
        ...zone,
        prixM2: zone.prixM2 || (zone.prixTable / 4.5)
      }));

      this.save.emit(formValue);
      this.form.reset();
      this.form.patchValue({
        zonesTarifaires: [this.createZoneGroup().value]
      });
    }
  }

  onCancel() {
    this.cancel.emit();
    this.form.reset();
  }
}