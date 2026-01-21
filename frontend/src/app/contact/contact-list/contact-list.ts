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

  contacts = computed(() => {
    const editeur = this.editeur()
    return editeur?.contacts || []
  })

  // Signal pour gérer l'édition
  contactEnEdition = signal<PersonneDto | undefined>(undefined);

  constructor() {
    // Charger les éditeurs si la liste est vide
    if (this.editeurService.editeurs().length === 0) {
      this.editeurService.loadEditeurs();
    }
  }

  onEdit(contact: PersonneDto): void {
    this.contactEnEdition.set(contact);
    this.afficherFormulaire.set(true);
  }

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
      this.contactEnEdition.set(undefined)
    }
  }

  onUpdate(updatedContact: PersonneDto): void {
    const editeurId = this.editeurId();
    
    if (editeurId && updatedContact.id) {
      this.editeurService.updateContact(editeurId, updatedContact);
      this.afficherFormulaire.set(false);
      this.contactEnEdition.set(undefined);
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