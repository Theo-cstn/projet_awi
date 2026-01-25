import { Component, input, output, signal } from '@angular/core';
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
  editeur = input.required<EditeurDto>();

  
  canEdit = input<boolean>(false);
  edit = output<EditeurDto>();

  showContacts = signal(false);

  toggleContacts(event: Event): void {
    event.stopPropagation();
    this.showContacts.update(v => !v);
  }

  onEdit() {
    this.edit.emit(this.editeur());
  }
}