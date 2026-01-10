import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ReservationListService } from '../reservation-service/reservation-list-service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-reservation-list',
  imports: [],
  templateUrl: './reservation-list.html',
  styleUrl: './reservation-list.css',
})
export class ReservationList implements OnInit {
  private svc = inject(ReservationListService); 
  private route = inject(ActivatedRoute); 
  private router = inject(Router); 
  
  festivalId = signal<number | undefined>(undefined); 
  reservations = computed(() => this.svc.reservations()); 
  
  ngOnInit(): void { 
    this.detectContextAndLoad(); 
  } 
  private detectContextAndLoad() { 
    const id = this.route.parent?.snapshot.paramMap.get('id'); 
    if (id) { 
      this.festivalId.set(Number(id)); this.svc.loadReservations(Number(id)); 
    } 
  } 
  openReservation(rId: number) { 
    this.router.navigate([`/festivals/${this.festivalId()}/reservations/${rId}`]); 
  }

}
