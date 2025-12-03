import { Component, output } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';


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
