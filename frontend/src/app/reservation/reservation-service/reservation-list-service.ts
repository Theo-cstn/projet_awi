import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Reservation } from '../../types/reservation-dto';

@Injectable({
  providedIn: 'root',
})
export class ReservationListService {

  private readonly http = inject(HttpClient); 

  private readonly apiUrl = 'https://localhost:4000/api/reservation'; 
  private readonly festivalApiUrl = 'https://localhost:4000/api/reservation/festival'; 
  
  private readonly _reservations = signal<Reservation[]>([]); 
  readonly reservations = this._reservations.asReadonly();

  loadReservations(festivalId: number): void { 
    const url = `${this.festivalApiUrl}/${festivalId}`; 

    this.http.get<any[]>(url, { withCredentials: true }).subscribe({ 
      next: (data) => { 
        const mapped: Reservation[] = data.map(r => ({ 
        id: r.id, 
        festival_id: r.festival_id, 
        type: r.type, 
        nom_reservant: r.nom_reservant, 
        editeur_id: r.editeur_id, 
        nombre_tables: r.nombre_tables, 
        nombre_prises: r.nombre_prises, 
        remise_generale: r.remise_generale, 
        est_present: r.est_present, 
        status: r.status, 
        date_creation: r.date_creation, 
        date_facturation: r.date_facturation, 
        date_paiement: r.date_paiement, 
        total_a_payer: r.total_a_payer, 
        nb_jeux: r.nb_jeux 
      })); 
      
      this._reservations.set(mapped); 
    }, 
    error: (err) => console.error('Erreur chargement réservations', err) 
  }); }

  getDetails(id: number) { 
    return this.http.get<any>(`${this.apiUrl}/${id}/details`, { withCredentials: true }); 
  } 
  create(payload: any) { 
    return this.http.post(`${this.apiUrl}`, payload, { withCredentials: true }); 
  } 
  delete(id: number) { 
    return this.http.delete(`${this.apiUrl}/${id}`, { withCredentials: true }); 
  }
  
}
