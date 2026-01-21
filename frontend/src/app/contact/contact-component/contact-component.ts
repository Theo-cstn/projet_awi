import { Component, input, output } from '@angular/core';
import { PersonneDto } from '../../types/personne-dto';

@Component({
  selector: 'app-contact-component',
  imports: [],
  templateUrl: './contact-component.html',
  styleUrl: './contact-component.css',
})
export class ContactComponent {
  contact = input.required<PersonneDto>();

  // Pour l'édition
  canEdit = input<boolean>(false);
  edit = output<PersonneDto>();

  onEdit() {
    this.edit.emit(this.contact());
  }
}
