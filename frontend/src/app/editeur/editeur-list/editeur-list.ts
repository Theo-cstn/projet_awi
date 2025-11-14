import { Component, inject } from '@angular/core';
import { EditeurListService } from '../editeur-service/editeur-list-service';
import { EditeurDto } from '../../types/editeur-dto';
import { EditeurComponent } from '../editeur-component/editeur-component';
import { EditeurForm } from '../editeur-form/editeur-form';


@Component({
  selector: 'app-editeur-list',
  imports: [EditeurComponent, EditeurForm],
  templateUrl: './editeur-list.html',
  styleUrl: './editeur-list.css',
})
export class EditeurList {
  readonly svc = inject(EditeurListService)
  editeurs = this.svc.editeurs

  onAdd(formData: any):void{
    const newediteur: EditeurDto = {
      id: undefined,
      nom: formData.nom,
      contacts: undefined
    }
    this.svc.add(newediteur)
  }
}
