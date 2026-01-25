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

  canEdit = input<boolean>(false);
  edit = output<PersonneDto>();
  
  delete = output<PersonneDto>();

  onEdit() {
    this.edit.emit(this.contact());
  }

  onDelete() {
    if(confirm('Voulez-vous vraiment supprimer ce contact ?')) {
      this.delete.emit(this.contact());
    }
  }
}