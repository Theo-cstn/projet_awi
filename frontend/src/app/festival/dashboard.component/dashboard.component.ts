import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FestivalLayoutComponent } from '../festival-layout.component/festival-layout.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  private layout = inject(FestivalLayoutComponent);
  
  festival = this.layout.festival;
}