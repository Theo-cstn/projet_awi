import { Component } from '@angular/core';
import { FestivalList } from './festival/festival-list/festival-list';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FestivalList],
  template: `
    <div style="background: #f5f5f5; min-height: 100vh;">
      <app-festival-list></app-festival-list>
    </div>
  `
})
export class App {}