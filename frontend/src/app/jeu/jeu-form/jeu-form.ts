import { Component, output, inject, input, computed, effect } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EditeurListService } from '../../editeur/editeur-service/editeur-list-service';
import { PersonneService } from '../../personne/personne-service';
import { UpperCasePipe } from '@angular/common'; // Import nécessaire pour le template
import { JeuDto } from '../../types/jeu-dto';

@Component({
  selector: 'app-jeu-form',
  // ✅ On garde UpperCasePipe
  imports: [ReactiveFormsModule, UpperCasePipe], 
  templateUrl: './jeu-form.html',
  styleUrl: './jeu-form.css',
})
export class JeuForm {
  // ... (injections et inputs inchangés) ...
  private readonly editeurService = inject(EditeurListService);
  private readonly personneService = inject(PersonneService);

  editeurId = input<number|undefined>(undefined);
  jeuAEditer = input<JeuDto | undefined>(undefined);

  modeEdition = computed(() => this.jeuAEditer() !== undefined);
  editeurPreSelected = computed(() => this.editeurId() !== undefined || this.modeEdition());

  update = output<JeuDto>();
  add = output<any>();
  submitted = false;

  readonly form = new FormGroup({
    nom: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    ageMin: new FormControl<number | null>(null, { validators: [Validators.min(0)] }),
    ageMax: new FormControl<number | null>(null, { validators: [Validators.min(0)] }),
    editeur: new FormControl<number | null>(null, { validators: [Validators.required] }),
    
    auteurs: new FormControl<number[]>([], { nonNullable: true }),
    
    type: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  constructor(){
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
          // On mappe les objets auteurs vers un tableau d'IDs pour le formulaire
          auteurs: jeu.auteurs?.map(a => a.id).filter((id): id is number => id !== undefined) || []
        });
      } else if (this.editeurId()) {
        this.form.patchValue({ editeur: this.editeurId() });
      }
    });
  }

  onSubmit(): void {
    this.submitted = true;

    // Logique de pré-sélection forcée (inchangée)
    if (this.editeurPreSelected()) {
      if (this.editeurId()) {
        this.form.patchValue({ editeur: this.editeurId() });
      } 
      else if (this.modeEdition() && this.jeuAEditer()) {
        this.form.patchValue({ editeur: this.jeuAEditer()!.editeur_id });
      }
    }

    if (this.form.valid) {
      const f = this.form.getRawValue();
      const jeuEdit = this.jeuAEditer();

      // Sécurité pour l'éditeur
      if (!f.editeur) { console.error("Editeur manquant"); return; }

      const payload = {
        nom: f.nom,
        typeG: f.type,
        age_min: f.ageMin, 
        age_max: f.ageMax,
        editeur_id: f.editeur,
        
        // IMPORTANT : On envoie la liste des IDs au backend via la clé 'auteurs_ids'
        auteurs_ids: f.auteurs, 
        
        // Champs techniques pour le DTO Frontend (pas lus par le backend mais requis par TypeScript)
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

  ajouterAuteur(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const id = Number(select.value);

    if (!id) return; // Sécurité si valeur vide

    const actuels = this.form.controls.auteurs.value;
    
    // On évite les doublons
    if (!actuels.includes(id)) {
      this.form.controls.auteurs.setValue([...actuels, id]);
    }

    // On remet le select sur l'option par défaut
    select.value = "";
  }

  // 2. Retirer un auteur quand on clique sur la croix
  retirerAuteur(idToRemove: number): void {
    const actuels = this.form.controls.auteurs.value;
    this.form.controls.auteurs.setValue(actuels.filter(id => id !== idToRemove));
  }

  // 3. Helper pour afficher le nom dans les badges (car le form ne stocke que l'ID)
  getNomAuteur(id: number): string {
    const p = this.personnes().find(p => p.id === id);
    return p ? `${p.prenom} ${p.nom}` : 'Inconnu';
  }

  personnes() {
    return this.personneService.personnes();
  }

  getErrorMessage(control: AbstractControl | null): string | null {
    if (control != null) {
      if (control.errors?.['required']) return "Champ obligatoire";
      if (control.errors?.['minlength']) return `Trop court`;
      if (control.errors?.['min']) return "Doit être positif";
    }
    return null;
  }
  
  editeurs() { return this.editeurService.editeurs(); }
  
  getNomEditeur(): string {
     if (this.editeurId()) {
      const editeur = this.editeurs().find(e => e.id === this.editeurId());
      return editeur?.nom || 'Editeur selectionné';
    }
    else if (this.modeEdition() && this.jeuAEditer()) {
      const editeur = this.editeurs().find(e => e.id === this.jeuAEditer()!.editeur_id);
      return editeur?.nom || 'Editeur du jeu';
    }
    return 'Editeur selectionné';
  }

  
  readonly typesJeu = ['Action', 'Aventure', 'RPG', 'Reflexion', 'Simulation', 'Strategie', 'Sport', 'Carte'];
}