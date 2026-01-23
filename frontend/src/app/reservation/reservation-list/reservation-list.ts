import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ReservationListService } from '../reservation-service/reservation-list-service';
import { ActivatedRoute } from '@angular/router';
import { ReservationForm } from '../reservation-form/reservation-form';
import { ReservationComponent } from '../reservation-component/reservation-component';
import { Reservation } from '../../types/reservation-dto'; 

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [ReservationForm, ReservationComponent],
  templateUrl: './reservation-list.html',
  styleUrl: './reservation-list.css',
})
export class ReservationList implements OnInit {
  private svc = inject(ReservationListService); 
  private route = inject(ActivatedRoute); 
  
  festivalId = signal<number | undefined>(undefined); 
  showForm = signal(false);
  reservationToEdit = signal<any>(undefined); 

  reservations = computed(() => {
    const fId = this.festivalId();
    const allReservations = this.svc.reservations();
    if (!fId) return [];
    return allReservations.filter(r => r.festival_id === fId);
  });
  
  ngOnInit(): void {
    this.detectContextAndLoad(); 
  } 
  
  private detectContextAndLoad() { 
    const id = this.route.parent?.parent?.snapshot.paramMap.get('id'); 
    if (id) { 
      const numId = Number(id);
      this.festivalId.set(numId); 
      this.svc.loadReservations(numId);
    }
  } 

  createRequest() {
    this.reservationToEdit.set(undefined);
    this.showForm.set(true);
  }

  editRequest(r: Reservation) {
    if (!r.id) return;
    this.svc.getDetails(r.id).subscribe({
      next: (fullDetails: any) => {
        const flatObj = {
          ...fullDetails.reservation,
          lignes: fullDetails.lignes,
          jeux: fullDetails.jeux
        };
        this.reservationToEdit.set(flatObj);
        this.showForm.set(true);
      },
      error: (err) => console.error("Erreur chargement détails", err)
    });
  }

  onFormClose() {
    this.showForm.set(false);
    this.reservationToEdit.set(undefined);
    if (this.festivalId()) {
      this.svc.loadReservations(this.festivalId()!);
    }
  }

  deleteRequest(r: Reservation) {
    if (!r.id) return;
    if (confirm("Supprimer cette réservation ?")) {
      this.svc.delete(r.id).subscribe(() => {
        if (this.festivalId()) this.svc.loadReservations(this.festivalId()!);
      });
    }
  }

  updateStatusRequest(r: Reservation, newStatus: 'PRESENT' | 'FACTUREE' | 'PAYEE') {
    if (!r.id) return;
    
    this.svc.updateStatut(r.id, newStatus).subscribe({
      next: () => {
        if (this.festivalId()) this.svc.loadReservations(this.festivalId()!);
      },
      error: (err) => console.error("Erreur update statut", err)
    });
  }
}