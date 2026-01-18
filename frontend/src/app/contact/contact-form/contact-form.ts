import { Component, output, input, computed, effect } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PersonneDto } from '../../types/personne-dto';

@Component({
  selector: 'app-contact-form',
  imports: [ReactiveFormsModule],
  templateUrl: './contact-form.html',
  styleUrl: './contact-form.css',
})
export class ContactForm {
  editeurId = input<number|undefined>(undefined);
  
  // Input du contact à éditer
  contactAEditer = input<PersonneDto | undefined>(undefined);

  modeEdition = computed(() => this.contactAEditer() !== undefined);

  readonly form = new FormGroup({
    nom: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)]
    }),

    prenom: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)]
    }),

    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
  });

  add = output<any>();
  update = output<PersonneDto>();
  submitted = false;

  constructor() {
    // Pré-remplir le formulaire quand contactAEditer change
    effect(() => {
      const contact = this.contactAEditer();
      
      if (contact) {
        // Mode édition : pré-remplir le formulaire
        this.form.patchValue({
          nom: contact.nom,
          prenom: contact.prenom,
          email: contact.email
        });
      } else {
        // Mode ajout : réinitialiser le formulaire
        this.form.reset();
      }
    });
  }

  onSubmit(): void {
    this.submitted = true;
    
    if (this.form.valid) {
      const contactEdit = this.contactAEditer();

      if (contactEdit) {
        // Mode édition - émet via update
        this.update.emit({
          id: contactEdit.id!,
          nom: this.form.value.nom!,
          prenom: this.form.value.prenom!,
          email: this.form.value.email!
        });
      } else {
        // Mode création - émet via add
        this.add.emit({
          nom: this.form.value.nom!,
          prenom: this.form.value.prenom!,
          email: this.form.value.email!,
          editeur: this.editeurId()
        });
      }
      
      this.form.reset();
      this.submitted = false;
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