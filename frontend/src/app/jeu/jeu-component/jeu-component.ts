import { Component, input, output } from '@angular/core';
import { JeuDto } from '../../types/jeu-dto';

@Component({
  selector: 'app-jeu-component',
  imports: [],
  templateUrl: './jeu-component.html',
  styleUrl: './jeu-component.css',
})
export class JeuComponent {
  jeu = input.required<JeuDto>();

  // Pour l'édition
  canEdit = input<boolean>(false);
  edit = output<JeuDto>();

  onEdit() {
    this.edit.emit(this.jeu());
  }
}
