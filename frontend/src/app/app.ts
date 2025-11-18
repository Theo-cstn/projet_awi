import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EditeurList } from './editeur/editeur-list/editeur-list';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, EditeurList],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('festival');
}
