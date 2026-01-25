import { Component, output, inject, input, computed, effect, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UpperCasePipe } from '@angular/common';
import { EditeurListService } from '../../editeur/editeur-service/editeur-list-service';
import { PersonneService } from '../../personne/personne-service';
import { JeuDto } from '../../types/jeu-dto';

@Component({
  selector: 'app-jeu-form',
  imports: [ReactiveFormsModule, UpperCasePipe],
  templateUrl: './jeu-form.html',
  styleUrl: './jeu-form.css',
})
export class JeuForm {
  // Services
  private readonly editeurService = inject(EditeurListService);
  private readonly personneService = inject(PersonneService);

  // Inputs / Outputs
  editeurId = input<number | undefined>(undefined);
  jeuAEditer = input<JeuDto | undefined>(undefined);

  update = output<JeuDto>();
  add = output<any>();

  // États calculés
  modeEdition = computed(() => this.jeuAEditer() !== undefined);
  editeurPreSelected = computed(() => this.editeurId() !== undefined || this.modeEdition());
  
  // États locaux
  submitted = false;
  showNewAuteur = signal(false);

  // Formulaire principal
  readonly form = new FormGroup({
    nom: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    ageMin: new FormControl<number | null>(null, { validators: [Validators.min(0)] }),
    ageMax: new FormControl<number | null>(null, { validators: [Validators.min(0)] }),
    editeur: new FormControl<number | null>(null, { validators: [Validators.required] }),
    auteurs: new FormControl<number[]>([], { nonNullable: true }),
    type: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  // Sous-formulaire pour création rapide
  readonly auteurForm = new FormGroup({
    nom: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    prenom: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true }) // Email facultatif
  });

  readonly typesJeu = ['Action', 'Aventure', 'RPG', 'Reflexion', 'Simulation', 'Strategie', 'Sport', 'Carte'];

  constructor() {
    this.editeurService.loadEditeurs();
    this.personneService.loadPersonnes();

    effect(() => {
      const jeu = this.jeuAEditer();

      if (jeu) {
        this.form.patchValue({
          nom: jeu.nom,
          ageMin: jeu.age_min,
          ageMax: jeu.age_max,
          editeur: jeu.editeur_id,
          type: jeu.typeG,
          auteurs: jeu.auteurs?.map(a => a.id).filter((id): id is number => id !== undefined) || []
        });
      } else if (this.editeurId()) {
        this.form.patchValue({ editeur: this.editeurId() });
      }
    });
  }

  // --- GETTERS & HELPERS ---

  editeurs() { return this.editeurService.editeurs(); }
  personnes() { return this.personneService.personnes(); }

  getNomEditeur(): string {
    const id = this.editeurId() ?? this.jeuAEditer()?.editeur_id;
    if (id) {
      const editeur = this.editeurs().find(e => e.id === id);
      return editeur?.nom || 'Éditeur sélectionné';
    }
    return 'Éditeur sélectionné';
  }

  getNomAuteur(id: number): string {
    const p = this.personnes().find(p => p.id === id);
    return p ? `${p.prenom} ${p.nom}` : 'Chargement...';
  }

  getErrorMessage(control: AbstractControl | null): string | null {
    if (control != null) {
      if (control.errors?.['required']) return "Champ obligatoire";
      if (control.errors?.['minlength']) return `Trop court`;
      if (control.errors?.['min']) return "Doit être positif";
    }
    return null;
  }

  // --- ACTIONS DU FORMULAIRE ---

  onSubmit(): void {
    this.submitted = true;

    if (this.editeurPreSelected()) {
      if (this.editeurId()) {
        this.form.patchValue({ editeur: this.editeurId() });
      } else if (this.modeEdition() && this.jeuAEditer()) {
        this.form.patchValue({ editeur: this.jeuAEditer()!.editeur_id });
      }
    }

    if (this.form.valid) {
      const f = this.form.getRawValue();
      const jeuEdit = this.jeuAEditer();

      if (!f.editeur) { console.error("Editeur manquant"); return; }

      const payload = {
        nom: f.nom,
        typeG: f.type,
        age_min: f.ageMin,
        age_max: f.ageMax,
        editeur_id: f.editeur,
        auteurs_ids: f.auteurs,
        editeur: undefined as any,
        auteurs: []
      };

      if (jeuEdit) {
        this.update.emit({ ...payload, id: jeuEdit.id! });
      } else {
        this.add.emit(payload);
      }

      this.form.reset();
      this.submitted = false;
    }
  }

  // --- GESTION DES AUTEURS (Selection) ---

  ajouterAuteur(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const id = Number(select.value);
    if (!id) return;

    const actuels = this.form.controls.auteurs.value;
    if (!actuels.includes(id)) {
      this.form.controls.auteurs.setValue([...actuels, id]);
    }
    select.value = "";
  }

  retirerAuteur(idToRemove: number): void {
    const actuels = this.form.controls.auteurs.value;
    this.form.controls.auteurs.setValue(actuels.filter(id => id !== idToRemove));
  }

  // --- GESTION DE LA CRÉATION RAPIDE D'AUTEUR ---

  toggleNewAuteur(): void {
    this.showNewAuteur.update(v => !v);
  }

  saveNewAuteur(): void {
    if (this.auteurForm.valid) {
      const newPerson = this.auteurForm.getRawValue();

      this.personneService.create(newPerson).subscribe({
        next: (createdPerson) => {
          this.personneService.loadPersonnes();

          if (createdPerson.id) {
            const currentSelection = this.form.controls.auteurs.value;
            this.form.controls.auteurs.setValue([...currentSelection, createdPerson.id]);
          }

          this.auteurForm.reset();
          this.showNewAuteur.set(false);
        },
        error: (err) => console.error('Erreur lors de la création de l\'auteur', err)
      });
    }
  }
}