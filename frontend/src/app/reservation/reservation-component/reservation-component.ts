import { Component, input, computed } from '@angular/core';
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
  
  // Nom du réservant (éditeur ou autre) 
  nomReservant = computed(() => { const r = this.reservation(); return r.autre_nom_reservant ?? `Éditeur #${r.editeur_id}`; }); 
  totalTables = computed(() => this.reservation().lignes.reduce((acc, l) => acc + l.quantite, 0) );
  totalPrix = computed(() => this.reservation().lignes.reduce( (acc, l) => acc + l.quantite * l.prix_unitaire_applique, 0 ) - this.reservation().remise_generale );

}