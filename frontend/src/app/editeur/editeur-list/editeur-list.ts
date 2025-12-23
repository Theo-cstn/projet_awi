import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { EditeurListService } from '../editeur-service/editeur-list-service';
import { AuthService } from '../../shared/auth/auth.service';
import { EditeurComponent } from '../editeur-component/editeur-component';
import { EditeurForm } from '../editeur-form/editeur-form';
import { EditeurDto } from '../../types/editeur-dto';

@Component({
  selector: 'app-editeur-list',
  standalone: true,
  imports: [CommonModule, RouterLink, EditeurComponent, EditeurForm],
  templateUrl: './editeur-list.html',
  styleUrl: './editeur-list.css'
})
export class EditeurList implements OnInit {
  // Services
  readonly svc = inject(EditeurListService);
  readonly auth = inject(AuthService);
  private route = inject(ActivatedRoute);

  readonly editeurs = this.svc.editeurs;

  // État du formulaire
  afficherFormulaire = signal(false);

  ngOnInit(): void {
    this.loadData();
  }

  private loadData() {
    // Récupération de l'ID depuis le parent (Festival)
    const parentId = this.route.parent?.snapshot.paramMap.get('id');
    
    if (parentId) {
       this.svc.loadEditeurs(Number(parentId));
    } else {
       this.svc.loadEditeurs();
    }
  }

  // --- INTERFACE ---

  toggleFormulaire(): void {
    this.afficherFormulaire.update(v => !v);
  }

  onAdd(formData: any): void {
    const nouvelEditeur: EditeurDto = {
      id: undefined,
      nom: formData.nom,
      contacts: [],
    };
    this.svc.add(nouvelEditeur);
    this.afficherFormulaire.set(false);
  }

  edit(editeur: EditeurDto): void {
    // TODO
  }
}