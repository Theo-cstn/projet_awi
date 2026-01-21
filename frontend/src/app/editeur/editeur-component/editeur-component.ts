import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EditeurDto } from '../../types/editeur-dto';
import { ContactList } from '../../contact/contact-list/contact-list';
@Component({
  selector: 'app-editeur-component',
  standalone: true,
  imports: [CommonModule, RouterLink, ContactList], 
  templateUrl: './editeur-component.html',
  styleUrl: './editeur-component.css'
})
export class EditeurComponent {
  editeur = input.required<EditeurDto>();
  showContacts = signal(false);

  toggleContacts(event: Event): void {
    event.stopPropagation();
    this.showContacts.update(v => !v);
  }
}