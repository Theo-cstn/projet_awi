import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EditeurDto } from '../../types/editeur-dto';

@Component({
  selector: 'app-editeur-component',
  standalone: true,
  imports: [CommonModule, RouterLink], 
  templateUrl: './editeur-component.html',
  styleUrl: './editeur-component.css'
})
export class EditeurComponent {
  // On reçoit juste l'éditeur en entrée
  editeur = input.required<EditeurDto>();

  // Gestion interne de l'affichage des contacts
  showContacts = signal(false);

  toggleContacts(event: Event) {
    event.stopPropagation();
    this.showContacts.update(v => !v);
  }
}