import { Component, inject, signal } from '@angular/core';
import { EditeurListService } from '../editeur-service/editeur-list-service';
import { EditeurComponent } from '../editeur-component/editeur-component';
import { EditeurForm } from '../editeur-form/editeur-form';
import { EditeurDto } from '../../types/editeur-dto';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-editeur-list',
  imports: [EditeurComponent, EditeurForm],
  templateUrl: './editeur-list.html',
  styleUrl: './editeur-list.css',
})
export class EditeurList {
  readonly svc = inject(EditeurListService)
  readonly editeurs = this.svc.editeurs


  onAdd(formData: any): void {
    const nouvelEditeur: EditeurDto = {
      id: undefined,
      nom: formData.nom,
      contacts: undefined,
      jeux: undefined
    }
    this.svc.add(nouvelEditeur)
  }

  afficherFormulaire = signal(false)
  
  toggleFormulaire(): void {
    this.afficherFormulaire.update(v => !v)
  }
}
