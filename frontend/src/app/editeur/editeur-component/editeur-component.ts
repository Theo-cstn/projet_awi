import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-editeur-component',
  imports: [],
  templateUrl: './editeur-component.html',
  styleUrl: './editeur-component.css',
})
export class EditeurComponent {
  @Input() editeur: any = {};
}
