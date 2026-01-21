import { Component, signal, output, input, effect, computed } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { ZonePlan } from '../../types/zone-plan-dto';

@Component({
  selector: 'app-zone-plan-form',
  imports: [ReactiveFormsModule],
  templateUrl: './zone-plan-form.html',
  styleUrl: './zone-plan-form.css',
})
export class ZonePlanForm {
  readonly newZonePlan = signal<Omit<ZonePlan, 'id'>>({nom: '', nbTables: 0})
  zonePlanAEditer = input<ZonePlan>();
  modeEdition = computed(() => this.zonePlanAEditer() !== undefined);

  add = output< Omit<ZonePlan, 'id'> >();
  update = output<ZonePlan>();
  cancel = output<void>();
  
  readonly form = new FormGroup({
    nom: new FormControl('', {nonNullable: true}),
    nbTables: new FormControl(0, {nonNullable: true})
  })

  constructor() {
    effect(() => {
      const zonePlan = this.zonePlanAEditer();
      if (zonePlan) {
        this.form.patchValue({
          nom: zonePlan.nom,
          nbTables: zonePlan.nbTables
        });
      } else {
        this.form.reset({
          nom: '',
          nbTables: 0
        });
      }
    });
  }

  onSubmitForm(): void {
    if (this.modeEdition()) {
      const updatedZonePlan: ZonePlan = {
        id: this.zonePlanAEditer()!.id,
        nom: this.form.value.nom!,
        nbTables: this.form.value.nbTables!
      };
      this.update.emit(updatedZonePlan);
    } else {
      const zonePlan: Omit<ZonePlan, 'id'> = {
        nom: this.form.value.nom!,
        nbTables: this.form.value.nbTables!
      };
      this.add.emit(zonePlan);
    }

    this.form.reset({
      nom: '',
      nbTables: 0
    });
  }

  onCancel(): void {
    this.cancel.emit();
    this.form.reset({
      nom: '',
      nbTables: 0
    });
  }
}