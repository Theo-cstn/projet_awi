import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FestivalComponent } from './festival/festival-component/festival-component';
import { Festival } from './types/festival-dto';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FestivalComponent],
  template: `
    <div style="padding: 20px; background: #f5f5f5; min-height: 100vh;">
      <h1>Test Festival Component</h1>
      
      <div style="display: flex; flex-wrap: wrap; gap: 16px;">
        @for (festival of testFestivals; track festival.id) {
          <app-festival-component
            [festival]="festival"
            [isSelected]="festival.id === selectedId"
            (select)="onFestivalSelected($event)">
          </app-festival-component>
        }
      </div>
    </div>
  `
})
export class App {
  selectedId = 1;
  
  testFestivals: Festival[] = [
    {
      id: 1,
      nom: 'Festival Jeux Bordeaux 2024',
      nombreTablesLibres: 25,
      createdAt: new Date('2024-01-15')
    },
    {
      id: 2,
      nom: 'GameCon Paris',
      nombreTablesLibres: 42,
      createdAt: new Date('2024-02-10')
    },
    {
      id: 3,
      nom: 'Festival du Jeu Lyon',
      nombreTablesLibres: 8,
      createdAt: new Date('2024-03-05')
    }
  ];

  onFestivalSelected(festival: Festival) {
    console.log('Festival sélectionné:', festival);
    this.selectedId = festival.id;
  }
}