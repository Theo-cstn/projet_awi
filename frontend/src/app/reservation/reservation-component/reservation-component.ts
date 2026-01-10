import { Component, input, output } from '@angular/core';
import { Reservation } from '../../types/reservation-dto';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-reservation-component',
  imports: [DatePipe],
  templateUrl: './reservation-component.html',
  styleUrl: './reservation-component.css',
})
export class ReservationComponent {
  reservation = input.required<Reservation>();
}