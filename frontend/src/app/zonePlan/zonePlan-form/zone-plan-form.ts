import { Component, signal, output } from '@angular/core';
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
  readonly newZonePlan = signal<Omit<ZonePlan, 'id'>>({nom: '', nbTables: 1})

  add = output< Omit<ZonePlan, 'id'> >();
  readonly form = new FormGroup({
    nom: new FormControl('', {nonNullable: true}),
    nbTables: new FormControl(1, {nonNullable: true})
  })

  onSubmitForm(): void {
    const zonePlan: Omit<ZonePlan, 'id'> = {
      nom: this.form.value.nom!,
      nbTables: this.form.value.nbTables!
    }
    this.add.emit(zonePlan);

    this.form.reset({
      nom: '',
      nbTables: undefined
    })
  }
}