import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { JeuListService } from '../jeu-service/jeu-list-service';
import { EditeurListService } from '../../editeur/editeur-service/editeur-list-service';
import { JeuDto } from '../../types/jeu-dto';
import { JeuComponent } from '../jeu-component/jeu-component';
import { JeuForm } from '../jeu-form/jeu-form';

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
  editeurId = computed(() => {
    const id = this.route.snapshot.paramMap.get('id')
    return id ? Number(id) : undefined
  })
  
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
    const editeur = this.editeur()
    
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
    }
  }
  
  retourEditeurs(): void {
    this.router.navigate(['/editeurs'])
  }
}