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

  onAdd(formData: any): void {
    // Logique de récupération de l'éditeur
    const currentEditeurId = this.editeurId();
    const targetEditeurId = currentEditeurId || formData.editeur;
    
    // Si on est dans le contexte d'un éditeur, on l'utilise, sinon on le cherche
    const editeur = this.editeurService.findById(Number(targetEditeurId));
    
    if (editeur) {
      const newJeu: JeuDto = {
        id: undefined,
        nom: formData.nom,
        typeG: formData.type,  
        age_min: formData.ageMin,  
        age_max: formData.ageMax,  
        editeur_id: editeur.id!,
        editeur: editeur, // Attention aux références circulaires selon ton DTO
        auteurs: [] // Gestion des auteurs à prévoir plus tard
      };
      
      this.svc.add(newJeu);
      this.afficherFormulaire.set(false);
    } else {
        console.error("Impossible de trouver l'éditeur pour ce jeu");
    }
  }
}