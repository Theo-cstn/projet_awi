import { Component, output, input } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-contact-form',
  imports: [ReactiveFormsModule],
  templateUrl: './contact-form.html',
  styleUrl: './contact-form.css',
})
export class ContactForm {
  // ✅ Gardez seulement editeurId
  editeurId = input<number|undefined>(undefined)

  readonly form = new FormGroup({
    nom: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)]
    }),

    prenom: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)]
    }),

    fonction: new FormControl('', {
      nonNullable: true
    }),

    mail: new FormControl('', {
      nonNullable: true
    }),
  });

  add = output<any>()
  submitted = false

  onSubmit(): void {
    this.submitted = true
    
    if (this.form.valid) {
      this.add.emit({
        nom:  this.form.value.nom,
        prenom: this.form.value.prenom,
        fonction: this.form.value.fonction,
        mail: this.form.value.mail,
        editeur: this.editeurId()
      })
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
      if (control.errors?.['email']) {
        return "Email invalide"
      }
    }
    return null
  }
}