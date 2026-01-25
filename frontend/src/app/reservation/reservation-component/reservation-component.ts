import { Component, input, computed, output } from '@angular/core';
import { Reservation } from '../../types/reservation-dto';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-reservation-component',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './reservation-component.html',
  styleUrl: './reservation-component.css',
})
export class ReservationComponent {
  reservation = input.required<Reservation>(); 
  
  // --- NOUVEAUX OUTPUTS ---
  edit = output<void>();
  remove = output<void>();

  statusChange = output<'PRESENT' | 'FACTUREE' | 'PAYEE'>();

  // Nom du réservant (éditeur ou autre) 
  nomReservant = computed(() => { 
    const r = this.reservation(); 
    return r.autre_nom_reservant ?? `Éditeur #${r.editeur_id}`; 
  }); 
  
  totalTables = computed(() => this.reservation().lignes.reduce((acc, l) => acc + l.quantite, 0) );
  
  totalPrix = computed(() => {
    const lignesTotal = this.reservation().lignes.reduce((acc, l) => acc + l.quantite * l.prix_moment_reservation, 0);
    return lignesTotal - (this.reservation().remise_generale || 0);
  });

  onEdit(event: MouseEvent) {
    event.stopPropagation();
    this.edit.emit();
  }

  onStatusChange(event: Event) {
    event.stopPropagation();
    const val = (event.target as HTMLSelectElement).value as 'PRESENT' | 'FACTUREE' | 'PAYEE';
    this.statusChange.emit(val);
  }

  onRemove(event: MouseEvent) {
    event.stopPropagation();
    this.remove.emit();
  }
}