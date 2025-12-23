import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { JeuListService } from '../jeu-service/jeu-list-service';
import { EditeurListService } from '../../editeur/editeur-service/editeur-list-service';
import { AuthService } from '../../shared/auth/auth.service'; // Import auth
import { JeuDto } from '../../types/jeu-dto';
import { JeuComponent } from '../jeu-component/jeu-component';
import { JeuForm } from '../jeu-form/jeu-form';

@Component({
  selector: 'app-jeu-list',
  standalone: true,
  imports: [CommonModule, JeuComponent, JeuForm],
  templateUrl: './jeu-list.html',
  styleUrl: './jeu-list.css',
})
export class JeuList {
  readonly svc = inject(JeuListService);
  readonly editeurService = inject(EditeurListService);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  
  // Injection Auth pour le HTML
  readonly auth = inject(AuthService);

  // Signal pour afficher/masquer le formulaire
  afficherFormulaire = signal(false);

  // Signal pour stocker le jeu que l'on souhaite éditer 
  jeuEnEdition = signal<JeuDto | undefined>(undefined);

  // Récupérer l'ID de l'éditeur depuis l'URL (transformé en Signal)
  editeurId = toSignal(this.route.paramMap.pipe(
      map(params => {
        const id = params.get('id');
        return id ? Number(id) : undefined;
      })
    )
  );
  
  // Filtrer les jeux
  jeux = computed(() => {
    const id = this.editeurId();
    if (id) {
      return this.svc.jeux().filter(j => j.editeur_id === id);
    }
    return this.svc.jeux();
  });
  
  // Récupérer l'éditeur courant (Computed)
  editeur = computed(() => {
    const id = this.editeurId();
    return id ? this.editeurService.findById(id) : undefined;
  });

  toggleFormulaire(): void {
    this.afficherFormulaire.update(v => !v);
  }

  retourEditeurs(): void {
    this.router.navigate(['/editeurs']);
  }

  onEdit(jeu: JeuDto): void {
    this.jeuEnEdition.set(jeu);
    this.afficherFormulaire.set(true);
  }

  onDelete(id: number): void {
    if (confirm('Voulez-vous vraiment supprimer ce jeu ?')) {
      this.svc.delete(id);
    }
  }

  onAdd(formData: Omit<JeuDto, 'id'>): void {
    console.log('Ajout d\'un nouveau jeu:', formData);
    
    const editeur = this.editeurService.findById(formData.editeur_id);
    
    if (editeur) {
      const newJeu: JeuDto = {
        ...formData,
        id: undefined,
        editeur: editeur
      };
      
      this.svc.add(newJeu);
      this.afficherFormulaire.set(false);
    } else {
      console.error("Impossible de trouver l'éditeur pour ce jeu");
    }
  }

  onUpdate(updatedJeu: JeuDto): void {
    console.log('✏️ Modification du jeu:', updatedJeu);
    
    // ✨ Envoyer uniquement les champs que le backend attend
    this.svc.update({
      id: updatedJeu.id!,
      nom: updatedJeu.nom,
      typeG: updatedJeu.typeG,
      age_min: updatedJeu.age_min,
      age_max: updatedJeu.age_max,
      editeur_id: updatedJeu.editeur_id
    });
    
    this.afficherFormulaire.set(false);
    this.jeuEnEdition.set(undefined);
  }
}