import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { JeuListService } from '../jeu-service/jeu-list-service';
import { EditeurListService } from '../../editeur/editeur-service/editeur-list-service';
import { JeuDto } from '../../types/jeu-dto';
import { JeuComponent } from '../jeu-component/jeu-component';
import { JeuForm } from '../jeu-form/jeu-form';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'app-jeu-list',
  imports: [JeuComponent, JeuForm],
  templateUrl: './jeu-list.html',
  styleUrl: './jeu-list.css',
})
export class JeuList {
  readonly svc = inject(JeuListService)
  readonly editeurService = inject(EditeurListService)
  readonly route = inject(ActivatedRoute)
  readonly router = inject(Router)
  
  // Récupérer l'ID de l'éditeur depuis l'URL
  editeurId = toSignal(this.route.paramMap.pipe(
      map(params => {
        const id = params.get('id');
        return id ? Number(id) : undefined;
      })
    )
  );
  
  // Filtrer les jeux si un éditeur est sélectionné
  jeux = computed(() => {
    const id = this.editeurId()
    if (id) {
      return this.svc.jeux().filter(j => j.editeur.id === id)
    }
    return this.svc.jeux()
  })
  
  // Récupérer l'éditeur courant
  editeur = computed(() => {
    const id = this.editeurId()
    return id ? this.editeurService.findById(id) : undefined
  })

  onAdd(formData: any): void {
    // reucperer l'id du l'éditeur soit par le formulaire ( creation du jeu à partir de al liste générale) soit depuis le contexte ( creation du jeu depuis la liste de jeux d'un editeur)
    const editeurId = this.editeurId() || formData.editeur
    const editeur = this.editeurService.findById(editeurId)
    
    if (editeur) {
      const newJeu: JeuDto = {
        id: undefined,
        nom: formData.nom,
        ageMin: formData.ageMin,
        ageMax: formData.ageMax,
        editeur: editeur,
        auteur: undefined,
        type: formData.type,
        taille: formData.taille
      }
      this.svc.add(newJeu)
      this.afficherFormulaire.set(false)
    }
  }
  
  retourEditeurs(): void {
    this.router.navigate(['/editeurs'])
  }

  afficherFormulaire = signal(false)

  toggleFormulaire(): void {
    this.afficherFormulaire.update(v => !v)
  }

}