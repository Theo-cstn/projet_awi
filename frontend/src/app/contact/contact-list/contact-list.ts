import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EditeurListService } from '../../editeur/editeur-service/editeur-list-service';
import { PersonneDto } from '../../types/personne-dto';
import { ContactComponent } from '../contact-component/contact-component';
import { ContactForm } from '../contact-form/contact-form';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'app-contact-list',
  imports: [ContactComponent, ContactForm],
  templateUrl: './contact-list.html',
  styleUrl: './contact-list.css',
})
export class ContactList {
  readonly editeurService = inject(EditeurListService)
  readonly route = inject(ActivatedRoute)
  readonly router = inject(Router)

  editeurId = toSignal(this.route.paramMap.pipe(
      map(params => {
        const id = params.get('id');
        return id ? Number(id) : undefined;
      })
    )
  );

  editeur = computed(() => {
    const id = this.editeurId()
    return id ? this.editeurService.findById(id) : undefined
  })

  // AJOUT : computed pour les contacts
  contacts = computed(() => {
    const editeur = this.editeur()
    return editeur?.contacts || []
  })

  onAdd(formData: any): void {
    const editeurId = this.editeurId() // CORRECTION : appel de la fonction
    
    if (editeurId) {
      const newContact: PersonneDto = {
        id: undefined,
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
      }
      this.editeurService.addContact(editeurId, newContact)
      this.afficherFormulaire.set(false)
    }
  }

  afficherFormulaire = signal(false)
  
  toggleFormulaire(): void {
    this.afficherFormulaire.update(v => !v)
  }
  
  retourEditeurs(): void {
    this.router.navigate(['/editeurs'])
  }
}