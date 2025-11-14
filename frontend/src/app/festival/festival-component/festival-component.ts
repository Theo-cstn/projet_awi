import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Festival } from '../../types/festival-dto';

@Component({
  selector: 'app-festival-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './festival-component.html',
  styleUrl: './festival-component.css'
})
export class FestivalComponent {
  festival = input.required<Festival>();
  isSelected = input<boolean>(false);
  
  select = output<Festival>();

  onSelect() {
    this.select.emit(this.festival());
  }
}