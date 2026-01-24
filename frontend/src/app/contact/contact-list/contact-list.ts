import { Component, computed, inject, input, signal, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { EditeurListService } from '../../editeur/editeur-service/editeur-list-service';
import { PersonneDto } from '../../types/personne-dto';
import { ContactComponent } from '../contact-component/contact-component';
import { ContactForm } from '../contact-form/contact-form';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-contact-list',
  imports: [ContactComponent, ContactForm],
  templateUrl: './contact-list.html',
  styleUrl: './contact-list.css',
})
export class ContactList {
  readonly editeurService = inject(EditeurListService);
  readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  editeurIdFromInput = input<number | undefined>(undefined, { alias: 'editeurId' });
  routeId = input<string | undefined>(undefined, { alias: 'id' });
  editeurId = computed(() => {
    return this.editeurIdFromInput() ?? (this.routeId() ? Number(this.routeId()) : undefined);
  });

  editeur = computed(() => {
    const id = this.editeurId();
    if (id && this.editeurService.editeurs().length === 0) {
      this.editeurService.loadEditeurs();
    }
    return id ? this.editeurService.findById(id) : undefined;
  });

  contacts = computed(() => {
    return this.editeur()?.contacts || [];
  });

  contactEnEdition = signal<PersonneDto | undefined>(undefined);
  afficherFormulaire = signal(false);

  // --- ACTIONS ---

  onEdit(contact: PersonneDto): void {
    this.contactEnEdition.set(contact);
    this.afficherFormulaire.set(true);
  }

  onAdd(formData: any): void {
    const id = this.editeurId();
    if (id) {
      const newContact: PersonneDto = {
        id: undefined,
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        poste: formData.poste
      };
      
      this.editeurService.addContact(id, newContact).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
         next: () => {
            this.afficherFormulaire.set(false);
            this.contactEnEdition.set(undefined);
         },
         error: (err) => console.error(err)
      });
    }
  }

  onUpdate(updatedContact: PersonneDto): void {
    const id = this.editeurId();
    if (id && updatedContact.id) {
      this.editeurService.updateContact(id, updatedContact).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
           this.afficherFormulaire.set(false);
           this.contactEnEdition.set(undefined);
        }
      });
    }
  }

  toggleFormulaire(): void {
    this.afficherFormulaire.update(v => !v);
  }
  
  retourEditeurs(): void {
    this.router.navigate(['/editeurs']);
  }
}