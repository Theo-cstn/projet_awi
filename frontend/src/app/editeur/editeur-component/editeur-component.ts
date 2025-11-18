import { Component, input } from '@angular/core';
import { EditeurDto } from '../../types/editeur-dto';

@Component({
  selector: 'app-editeur-component',
  imports: [],
  templateUrl: './editeur-component.html',
  styleUrl: './editeur-component.css',
})
export class EditeurComponent {
    editeur = input.required<EditeurDto>()

}
