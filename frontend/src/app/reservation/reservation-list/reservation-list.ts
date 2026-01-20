import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ReservationListService } from '../reservation-service/reservation-list-service';
import { ActivatedRoute, Router } from '@angular/router';
import { ReservationComponent } from '../reservation-component/reservation-component';

@Component({
  selector: 'app-reservation-list',
  imports: [ReservationComponent],
  templateUrl: './reservation-list.html',
  styleUrl: './reservation-list.css',
})
export class ReservationList implements OnInit {
  private svc = inject(ReservationListService); 
  private route = inject(ActivatedRoute); 
  private router = inject(Router); 
  
  festivalId = signal<number | undefined>(undefined); 
  // Filtre les réservations pour afficher seulement celles du festival courant
  reservations = computed(() => {
    const fId = this.festivalId();
    const allReservations = this.svc.reservations();
    if (!fId) {
      return [];
    }
    const filtered = allReservations.filter(r => r.festival_id === fId);
    return filtered;
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
  openReservation(rId: number) { 
    this.router.navigate([`/festivals/${this.festivalId()}/reservations/${rId}`]); 
  }
  addReservation() {
    this.router.navigate(['new'], { 
      relativeTo: this.route,
      state: { festivalId: this.festivalId() } 
    });
  }
}
