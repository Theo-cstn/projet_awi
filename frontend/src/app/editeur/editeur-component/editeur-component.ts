import { Component, input, output } from '@angular/core';
import { EditeurDto } from '../../types/editeur-dto';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-editeur-component',
  imports: [RouterLink],
  templateUrl: './editeur-component.html',
  styleUrl: './editeur-component.css',
})
export class EditeurComponent {
    editeur = input.required<EditeurDto>()

    voirJeux = output<number>()  // Émet l'ID de l'éditeur
    voirContacts = output<number>()  // Émet l'ID de l'éditeur
    modifier = output<EditeurDto>()  // Émet l'éditeur complet à modifier
}
