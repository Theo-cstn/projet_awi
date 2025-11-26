import { Component, output, inject,input  } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EditeurListService } from '../../editeur/editeur-service/editeur-list-service';


@Component({
  selector: 'app-jeu-form',
  imports: [ReactiveFormsModule],
  templateUrl: './jeu-form.html',
  styleUrl: './jeu-form.css',
})
export class JeuForm {
private readonly editeurService = inject(EditeurListService);

    editeurId = input.required<number>()

  readonly form = new FormGroup({  
    nom: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)]
    }),
    
    ageMin: new FormControl<number | undefined>(undefined, {
      validators: [Validators.min(0)]
    }),
    
    ageMax: new FormControl<number | undefined>(undefined, {
      validators: [Validators.min(0)]
    }),
    
    
    auteur: new FormControl<number | undefined>(undefined),
    
    type: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    
    taille: new FormControl<'petit' | 'grand' | undefined>(undefined)
  });

  add = output<any>()
  submitted = false

  onSubmit(): void {
    this.submitted= true
    if (this.form.valid) {
      this.add.emit(this.form.value)
      this.form.reset()
      this.submitted = false
    }
  }

  getErrorMessage(control: AbstractControl | null): string | null {
    if (control != null) {  
      if (control.errors?.['required']) {
        return "Champ obligatoire"
      }
      if (control.errors?.['minlength']) {
        const required = control.errors['minlength'].requiredLength;
        return `Minimum ${required} caractères`;
      }
      if (control.errors?.['min']) {
        return "La valeur doit être positive"
      }
    }
    return null
  }

  get editeurs() {
    return this.editeurService.editeurs();
  }
}
