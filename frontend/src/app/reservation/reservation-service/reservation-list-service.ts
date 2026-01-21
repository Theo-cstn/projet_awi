  import { HttpClient } from '@angular/common/http';
  import { inject, Injectable, signal } from '@angular/core';
  import { Reservation } from '../../types/reservation-dto';

  @Injectable({
    providedIn: 'root',
  })
  export class ReservationListService {

    private readonly http = inject(HttpClient); 

    private readonly apiUrl = 'https://localhost:4000/api/reservations'; 
    private readonly festivalApiUrl = 'https://localhost:4000/api/reservations/festival'; 
    
    private readonly _reservations = signal<Reservation[]>([]); 
    readonly reservations = this._reservations.asReadonly();

    loadReservations(festivalId: number): void { 
      const url = `${this.festivalApiUrl}/${festivalId}`;
      
      this.http.get<any[]>(url, { withCredentials: true })
      .subscribe({ 
        next: (data) => { 
          
          const mapped: Reservation[] = data.map(r => ({ 
            id: r.id, 
            festival_id: r.festival_id, 
            type: r.type, 
            editeur_id: r.editeur_id, 
            autre_nom_reservant: r.autre_nom_reservant, 
            nombre_prises: r.nombre_prises, 
            remise_generale: r.remise_generale, 
            est_present: r.est_present, 
            lignes: r.lignes || [],
            jeux: r.jeux || []
          })); 
          this._reservations.set(mapped); 
        }
      }); 
    }

    getDetails(id: number) { 
      return this.http.get<Reservation>(`${this.apiUrl}/${id}/details`, { withCredentials: true }); 
    }
    create(payload: Reservation) { 
      return this.http.post(`${this.apiUrl}`, payload, { withCredentials: true }); 
    }
    delete(id: number) { 
      return this.http.delete(`${this.apiUrl}/${id}`, { withCredentials: true }); 
    }    
  }
