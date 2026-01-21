import { Component, computed, inject, signal, input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EditeurListService } from '../../editeur/editeur-service/editeur-list-service';
import { PersonneDto } from '../../types/personne-dto';
import { ContactComponent } from '../contact-component/contact-component';
import { ContactForm } from '../contact-form/contact-form';
import { ContactService } from '../contact-service/contact-service';

@Component({
  selector: 'app-contact-list',
  imports: [ContactComponent, ContactForm],
  templateUrl: './contact-list.html',
  styleUrl: './contact-list.css',
})
export class ContactList {
  readonly editeurService = inject(EditeurListService)
  readonly contactService = inject(ContactService)
  readonly route = inject(ActivatedRoute)
  readonly router = inject(Router)

  editeurId = input<number | undefined>(undefined)

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
    const editeurId = this.editeurId()
    
    if (editeurId) {
      const newContact: PersonneDto = {
        id: undefined,
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        poste: formData.poste
      }
      this.contactService.addContact(editeurId, newContact)
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