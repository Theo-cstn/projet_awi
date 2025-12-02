import { Component, output, inject, input, computed } from '@angular/core';
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
  // id de l'éditeur est optionnel - présent seulement si on vient d'un éditeur spécifique
  editeurId = input<number|undefined>(undefined)
  editeurPreSelected = computed(() => this.editeurId !== undefined)

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

    editeur: new FormControl<number|undefined>(undefined, {
      validators: [Validators.required]
    }),
    
    auteur: new FormControl<number | undefined>(undefined),
    
    type: new FormControl('', {
      validators: [Validators.required]
    }),
    
    taille: new FormControl<'petit' | 'grand' | undefined>(undefined)
  });

  add = output<any>()
  submitted = false

  constructor(){
    // si un editeur est preselectionner, on le met dans le formulaire
    if (this.editeurId()){
      this.form.patchValue({ editeur: this.editeurId() });
    }
  }

  onSubmit(): void {
    this.submitted= true

    if (this.editeurPreSelected()){
      this.form.patchValue({ editeur: this.editeurId() })
    }

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

  editeurs() {
    return this.editeurService.editeurs();
  }
  getNomEditeur(): string {
    const editeur = this.editeurs().find(e=>e.id === this.editeurId())
    return editeur?.nom || 'Editeur selectionné'
  }

  readonly typesJeu = [
    'Tout public',
    'Ambiance',
    'Experts',
    'Enfants',
    'Classiques',
    'Initiés',
    'Jeu de rôle'
  ];
}
