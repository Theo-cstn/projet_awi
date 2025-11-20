import { Component, inject } from '@angular/core';
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
  jeux = this.svc.jeux

  onAdd(formData: any): void {
    // Convertir l'ID de l'éditeur de string à number
    const editeurId = formData.editeur ? Number(formData.editeur) : undefined
    const editeur = editeurId ? this.editeurService.findById(editeurId) : undefined
    
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
}