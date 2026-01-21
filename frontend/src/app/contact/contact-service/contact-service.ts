import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PersonneDto } from '../../types/personne-dto';

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://localhost:4000/api/editeurs';

  addContact(editeurId: number, contact: PersonneDto): void {
    const payload = {
      nom: contact.nom,
      prenom: contact.prenom,
      email: contact.email,
      fonction: contact.poste,
      est_contact_principal: false
    };

    console.log('📤 Payload envoyé:', payload);

    this.http.post<PersonneDto>(
      `${this.apiUrl}/${editeurId}/contacts`, 
      payload,
      { withCredentials: true }
    ).subscribe({
      next: (newContact) => {
        console.log('Contact créé:', newContact);
      },
      error: (err) => {
        console.error('Erreur ajout contact:', err);
        console.error('Détails:', err.error);
      }
    });
  }

  deleteContact(editeurId: number, contactId: number): void {
    this.http.delete(
      `${this.apiUrl}/${editeurId}/contacts/${contactId}`,
      { withCredentials: true }
    ).subscribe({
      next: () => {
        console.log('Contact supprimé');
      },
      error: (err) => console.error('Erreur suppression contact:', err)
    });
  }
}