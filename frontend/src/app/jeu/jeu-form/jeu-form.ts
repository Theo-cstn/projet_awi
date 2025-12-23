import { Component, output, inject, input, computed, effect } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EditeurListService } from '../../editeur/editeur-service/editeur-list-service';
import { JeuDto } from '../../types/jeu-dto';


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
  
  // input du jeu que l'on modifie 
  jeuAEditer = input<JeuDto | undefined>(undefined);

  modeEdition = computed(() => this.jeuAEditer() !== undefined);
  
  // ✨ L'éditeur est pré-sélectionné si on vient d'un éditeur OU si on édite un jeu
  editeurPreSelected = computed(() => {
    return this.editeurId() !== undefined || this.modeEdition();
  });

  update = output<JeuDto>();

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
    // pré-remplir le formulaire quand jeuAEditer change
    effect(() => {
      const jeu = this.jeuAEditer();
      
      if (jeu) {
        // Mode édition : pré-remplir le formulaire
        this.form.patchValue({
          nom: jeu.nom,
          ageMin: jeu.age_min,
          ageMax: jeu.age_max,
          editeur: jeu.editeur_id,
          type: jeu.typeG
        });
      } else if (this.editeurId()) {
        // Mode ajout avec éditeur pré-sélectionné
        this.form.patchValue({ editeur: this.editeurId() });
      }
    });
  }

  onSubmit(): void {
    this.submitted = true;

    // Pré-remplir l'éditeur si nécessaire
    if (this.editeurPreSelected()) {
      // Si on vient d'un éditeur spécifique, on utilise cet ID
      if (this.editeurId()) {
        this.form.patchValue({ editeur: this.editeurId() });
      } 
      // Sinon, si on est en mode édition, on utilise l'éditeur du jeu
      else if (this.modeEdition() && this.jeuAEditer()) {
        this.form.patchValue({ editeur: this.jeuAEditer()!.editeur_id });
      }
    }

    if (this.form.valid) {
      const jeuEdit = this.jeuAEditer();

      if (jeuEdit) {
        // Mode édition - émet via update
        this.update.emit({
          id: jeuEdit.id!,
          nom: this.form.value.nom!,
          typeG: this.form.value.type!,
          age_min: this.form.value.ageMin ?? undefined, //convertit null en undefined
          age_max: this.form.value.ageMax ?? undefined,
          editeur_id: this.form.value.editeur!,
          editeur: undefined as any,
          auteurs: []
        });
      } else {
        // Mode création - émet via add
        this.add.emit({
          nom: this.form.value.nom!,
          typeG: this.form.value.type!,
          age_min: this.form.value.ageMin ?? undefined,
          age_max: this.form.value.ageMax ?? undefined,
          editeur_id: this.form.value.editeur!,
          editeur: undefined as any,
          auteurs: []
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
    // Si on vient d'un éditeur spécifique
    if (this.editeurId()) {
      const editeur = this.editeurs().find(e => e.id === this.editeurId());
      return editeur?.nom || 'Editeur selectionné';
    }
    // Si on est en mode édition, on récupère l'éditeur du jeu
    else if (this.modeEdition() && this.jeuAEditer()) {
      const editeur = this.editeurs().find(e => e.id === this.jeuAEditer()!.editeur_id);
      return editeur?.nom || 'Editeur du jeu';
    }
    return 'Editeur selectionné';
  }

  readonly typesJeu = [
    'Action',
    'Aventure',
    'RPG',
    'Reflexion',
    'Simulation',
    'Strategie',
    'Sport',
    'Carte'
  ];
}
