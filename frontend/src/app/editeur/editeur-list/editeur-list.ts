import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common'; // Souvent utile
import { EditeurListService } from '../editeur-service/editeur-list-service';
import { EditeurComponent } from '../editeur-component/editeur-component';
import { EditeurForm } from '../editeur-form/editeur-form';
import { EditeurDto } from '../../types/editeur-dto';
import { AuthService } from '../../shared/auth/auth.service'; // Import manquant corrigé

@Component({
  selector: 'app-editeur-list',
  standalone: true,
  imports: [CommonModule, EditeurComponent, EditeurForm],
  templateUrl: './editeur-list.html',
  styleUrl: './editeur-list.css',
})
export class EditeurList {
  // Injection des services
  readonly svc = inject(EditeurListService);
  readonly auth = inject(AuthService);

  readonly editeurs = this.svc.editeurs;

  // Signal pour l'affichage du formulaire
  afficherFormulaire = signal(false);

  toggleFormulaire(): void {
    this.afficherFormulaire.update(v => !v);
  }

  onAdd(formData: any): void {
    const nouvelEditeur: EditeurDto = {
      id: undefined,
      nom: formData.nom,
      contacts: undefined,
    };
    this.svc.add(nouvelEditeur);
    this.afficherFormulaire.set(false);
  }

  edit(editeur: EditeurDto): void {
    //TODO
  }
}