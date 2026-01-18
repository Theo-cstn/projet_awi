import { Component, effect, input, output } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EditeurDto } from '../../types/editeur-dto';


@Component({
  selector: 'app-editeur-form',
  imports: [ReactiveFormsModule],
  templateUrl: './editeur-form.html',
  styleUrl: './editeur-form.css',
})
export class EditeurForm {
  readonly form = new FormGroup({
      nom: new FormControl('', {nonNullable : true,
        validators: [Validators.required, Validators.minLength(3)]
    }),
    
  });

  editeurAEditer = input<EditeurDto | undefined>(undefined);

  add = output<any>();
  update = output<EditeurDto>();
  submitted = false;

  constructor() {
    // Effet pour remplir le formulaire quand on édite
    effect(() => {
      const editeur = this.editeurAEditer();
      if (editeur) {
        this.form.patchValue({
          nom: editeur.nom
        });
      } else {
        this.form.reset();
      }
    });
  }

  onSubmit(): void {
    this.submitted= true
    if (this.form.valid) {
      const editeur = this.editeurAEditer();
      
      if (editeur) {
        // Mode édition
        this.update.emit({
          ...editeur,
          nom: this.form.value.nom!
        });
      } else {
        // Mode ajout
        this.add.emit(this.form.value);
      }
      
      this.form.reset();
      this.submitted = false;
    }
  }

  getErrorMessage(control:AbstractControl|null): string|null {
    if (control != null){
      if (control.errors?.['required']) {
        return "Champ obligatoire"
      }
      if (control.errors?.['minlength']) {
        const required = control.errors['minlength'].requiredLength;
        return `Minimum ${required} caractères`;
      }
    }
    return null
  }
}
